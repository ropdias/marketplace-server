import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { SellersRepository } from '../repositories/sellers-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { SellerProfile } from '../../enterprise/entities/value-objects/seller-profile'
import { AttachmentsRepository } from '../repositories/attachments-repository'
import { Attachment } from '../../enterprise/entities/attachment'

interface GetSellerProfileUseCaseRequest {
  sellerId: string
}

type GetSellerProfileUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    sellerProfile: SellerProfile
  }
>

@Injectable()
export class GetSellerProfileUseCase {
  constructor(
    private sellersRepository: SellersRepository,
    private attachmentsRepository: AttachmentsRepository,
  ) {}

  async execute({
    sellerId,
  }: GetSellerProfileUseCaseRequest): Promise<GetSellerProfileUseCaseResponse> {
    let avatarAttachment: Attachment | null = null

    const seller = await this.sellersRepository.findById(sellerId)

    if (!seller) {
      return left(new ResourceNotFoundError())
    }

    if (seller.avatarId) {
      const foundAvatar = await this.attachmentsRepository.findById(
        seller.avatarId?.toString(),
      )

      if (foundAvatar) {
        avatarAttachment = foundAvatar
      }
    }

    const sellerProfile = SellerProfile.create({
      sellerId: seller.id,
      name: seller.name,
      phone: seller.phone,
      email: seller.email,
      avatar: avatarAttachment,
    })

    return right({
      sellerProfile,
    })
  }
}
