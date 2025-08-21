import { Injectable } from '@nestjs/common'
import { AttachmentsRepository } from '../repositories/attachments-repository'
import { Seller } from '../../enterprise/entities/seller'
import { SellerProfile } from '../../enterprise/entities/value-objects/seller-profile'
import { Attachment } from '../../enterprise/entities/attachment'

@Injectable()
export class SellerProfileFactory {
  constructor(private attachmentsRepository: AttachmentsRepository) {}

  async createFromSeller(seller: Seller): Promise<SellerProfile> {
    let avatarAttachment: Attachment | null = null

    if (seller.avatarId) {
      const foundAvatar = await this.attachmentsRepository.findById(
        seller.avatarId.toString(),
      )

      if (foundAvatar) {
        avatarAttachment = foundAvatar
      }
    }

    return SellerProfile.create({
      sellerId: seller.id,
      name: seller.name,
      phone: seller.phone,
      email: seller.email,
      avatar: avatarAttachment,
    })
  }
}
