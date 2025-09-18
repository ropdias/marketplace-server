import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { SellersRepository } from '../repositories/sellers-repository'
import { HashGenerator } from '../cryptography/hash-generator'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { AttachmentsRepository } from '../repositories/attachments-repository'
import { SellerEmailAlreadyExistsError } from './errors/seller-email-already-exists-error'
import { SellerPhoneAlreadyExistsError } from './errors/seller-phone-already-exists-error'
import { WrongCredentialsError } from './errors/wrong-credentials-error'
import { NewPasswordMustBeDifferentError } from './errors/new-password-must-be-different-error'
import { HashComparator } from '../cryptography/hash-comparator'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { SellerProfileDTO } from '../dtos/seller-profile-dtos'
import { SellerProfileMapper } from '../mappers/seller-profile-mapper'

interface EditSellerUseCaseRequest {
  sellerId: string
  name: string
  phone: string
  email: string
  avatarId?: string | null
  password?: string
  newPassword?: string
}

type EditSellerUseCaseResponse = Either<
  | ResourceNotFoundError
  | WrongCredentialsError
  | NewPasswordMustBeDifferentError
  | SellerEmailAlreadyExistsError
  | SellerPhoneAlreadyExistsError,
  {
    sellerProfile: SellerProfileDTO
  }
>

@Injectable()
export class EditSellerUseCase {
  constructor(
    private sellersRepository: SellersRepository,
    private attachmentsRepository: AttachmentsRepository,
    private hashGenerator: HashGenerator,
    private hashComparator: HashComparator,
  ) {}

  async execute({
    sellerId,
    name,
    phone,
    email,
    avatarId,
    password,
    newPassword,
  }: EditSellerUseCaseRequest): Promise<EditSellerUseCaseResponse> {
    let hashedNewPassword: string | undefined

    const seller = await this.sellersRepository.findById(sellerId)

    if (!seller) {
      return left(new ResourceNotFoundError('Seller not found.'))
    }

    if (newPassword) {
      if (!password) {
        return left(new WrongCredentialsError())
      }

      if (newPassword === password) {
        return left(new NewPasswordMustBeDifferentError())
      }

      const isPasswordValid = await this.hashComparator.compare(
        password,
        seller.password,
      )

      if (!isPasswordValid) {
        return left(new WrongCredentialsError())
      }

      hashedNewPassword = await this.hashGenerator.hash(newPassword)
    }

    if (email !== seller.email) {
      const sellerWithSameEmail =
        await this.sellersRepository.findByEmail(email)

      if (sellerWithSameEmail && sellerWithSameEmail.id !== seller.id) {
        return left(new SellerEmailAlreadyExistsError())
      }
    }

    if (phone !== seller.phone) {
      const sellerWithSamePhone =
        await this.sellersRepository.findByPhone(phone)

      if (sellerWithSamePhone && sellerWithSamePhone.id !== seller.id) {
        return left(new SellerPhoneAlreadyExistsError())
      }
    }

    if (avatarId) {
      const foundAvatar = await this.attachmentsRepository.findById(avatarId)

      if (!foundAvatar) {
        return left(new ResourceNotFoundError('Avatar not found.'))
      }
    }

    seller.name = name
    seller.phone = phone
    seller.email = email
    seller.avatarId = avatarId
      ? UniqueEntityID.create({ value: avatarId })
      : null
    seller.password = hashedNewPassword || seller.password

    await this.sellersRepository.save(seller)

    const sellerProfile = await this.sellersRepository.findSellerProfileById(
      seller.id.toString(),
    )

    if (!sellerProfile) {
      return left(new ResourceNotFoundError('Seller not found.'))
    }

    const sellerProfileDTO = SellerProfileMapper.toDTO(sellerProfile)

    return right({
      sellerProfile: sellerProfileDTO,
    })
  }
}
