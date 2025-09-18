import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Seller } from '../../enterprise/entities/seller'
import { SellersRepository } from '../repositories/sellers-repository'
import { HashGenerator } from '../cryptography/hash-generator'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { AttachmentsRepository } from '../repositories/attachments-repository'
import { PasswordIsDifferentError } from './errors/password-is-different-error'
import { SellerEmailAlreadyExistsError } from './errors/seller-email-already-exists-error'
import { SellerPhoneAlreadyExistsError } from './errors/seller-phone-already-exists-error'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { SellerProfileDTO } from '../dtos/seller-profile-dtos'
import { SellerProfileMapper } from '../mappers/seller-profile-mapper'
import { SellerProfile } from '../../enterprise/entities/value-objects/seller-profile'
import { Attachment } from '../../enterprise/entities/attachment'

interface CreateSellerUseCaseRequest {
  name: string
  phone: string
  email: string
  avatarId: string | null
  password: string
  passwordConfirmation: string
}

type CreateSellerUseCaseResponse = Either<
  | PasswordIsDifferentError
  | SellerEmailAlreadyExistsError
  | SellerPhoneAlreadyExistsError
  | ResourceNotFoundError,
  {
    sellerProfile: SellerProfileDTO
  }
>

@Injectable()
export class CreateSellerUseCase {
  constructor(
    private sellersRepository: SellersRepository,
    private attachmentsRepository: AttachmentsRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    name,
    phone,
    email,
    avatarId,
    password,
    passwordConfirmation,
  }: CreateSellerUseCaseRequest): Promise<CreateSellerUseCaseResponse> {
    if (password !== passwordConfirmation) {
      return left(new PasswordIsDifferentError())
    }

    const sellerWithSameEmail = await this.sellersRepository.findByEmail(email)

    if (sellerWithSameEmail) {
      return left(new SellerEmailAlreadyExistsError())
    }

    const sellerWithSamePhone = await this.sellersRepository.findByPhone(phone)

    if (sellerWithSamePhone) {
      return left(new SellerPhoneAlreadyExistsError())
    }

    let avatar: Attachment | null = null

    if (avatarId) {
      avatar = await this.attachmentsRepository.findById(avatarId)

      if (!avatar) {
        return left(new ResourceNotFoundError('The avatar was not found.'))
      }
    }

    const hashedPassword = await this.hashGenerator.hash(password)

    const seller = Seller.create({
      name,
      phone,
      email,
      password: hashedPassword,
      avatarId: avatarId ? UniqueEntityID.create({ value: avatarId }) : null,
    })

    await this.sellersRepository.create(seller)

    const sellerProfile = SellerProfile.create({
      sellerId: seller.id,
      name: seller.name,
      phone: seller.phone,
      email: seller.email,
      avatar,
    })

    const sellerProfileDTO = SellerProfileMapper.toDTO(sellerProfile)

    return right({
      sellerProfile: sellerProfileDTO,
    })
  }
}
