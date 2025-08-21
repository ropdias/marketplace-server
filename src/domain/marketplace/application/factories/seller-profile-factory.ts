import { Injectable } from '@nestjs/common'
import { AttachmentsRepository } from '../repositories/attachments-repository'
import { Seller } from '../../enterprise/entities/seller'
import { SellerProfile } from '../../enterprise/entities/value-objects/seller-profile'
import { Attachment } from '../../enterprise/entities/attachment'

interface ICreateFromSellerRequest {
  seller: Seller
}

interface ICreateFromSellerResponse {
  sellerProfile: SellerProfile
}

@Injectable()
export class SellerProfileFactory {
  constructor(private attachmentsRepository: AttachmentsRepository) {}

  async createFromSeller({
    seller,
  }: ICreateFromSellerRequest): Promise<ICreateFromSellerResponse> {
    let avatarAttachment: Attachment | null = null

    if (seller.avatarId) {
      const foundAvatar = await this.attachmentsRepository.findById(
        seller.avatarId.toString(),
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

    return {
      sellerProfile,
    }
  }
}
