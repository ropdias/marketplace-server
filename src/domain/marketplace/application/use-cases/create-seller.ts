import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Seller } from '../../enterprise/entities/seller'
import { SellersRepository } from '../repositories/sellers-repository'
import { HashGenerator } from '../cryptography/hash-generator'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { AttachmentsRepository } from '../repositories/attachments-repository'
import { PasswordIsDifferentError } from './errors/password-is-different-error'
import { Attachment } from '../../enterprise/entities/attachment'
import { SellerEmailAlreadyExistsError } from './errors/seller-email-already-exists-error'
import { SellerPhoneAlreadyExistsError } from './errors/seller-phone-already-exists-error'

interface CreateSellerUseCaseRequest {
  name: string
  phone: string
  email: string
  avatarId: string | null
  password: string
  passwordConfirmation: string
}

type CreateSellerUseCaseResponse = Either<
  | SellerEmailAlreadyExistsError
  | SellerPhoneAlreadyExistsError
  | ResourceNotFoundError,
  {
    seller: Seller
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

    let avatarAttachment: Attachment | undefined

    if (avatarId) {
      const foundAvatar = await this.attachmentsRepository.findById(avatarId)

      if (!foundAvatar) {
        return left(new ResourceNotFoundError())
      }

      avatarAttachment = foundAvatar
    }

    const hashedPassword = await this.hashGenerator.hash(password)

    const seller = Seller.create({
      name,
      phone,
      email,
      password: hashedPassword,
      avatar: avatarAttachment,
    })

    await this.sellersRepository.create(seller)

    return right({
      seller,
    })
  }
}
