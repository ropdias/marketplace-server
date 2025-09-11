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
import { SellerProfileAssembler } from '../assemblers/seller-profile-assembler'

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
    private sellerProfileAssembler: SellerProfileAssembler,
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

    if (avatarId) {
      const foundAvatar = await this.attachmentsRepository.findById(avatarId)

      if (!foundAvatar) {
        return left(new ResourceNotFoundError())
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

    const sellerProfileEither = await this.sellerProfileAssembler.assemble({
      seller: seller,
    })
    if (sellerProfileEither.isLeft()) return left(sellerProfileEither.value)

    const sellerProfileDTO = SellerProfileMapper.toDTO(
      sellerProfileEither.value,
    )

    await this.sellersRepository.create(seller)

    return right({
      sellerProfile: sellerProfileDTO,
    })
  }
}
