import { Injectable } from '@nestjs/common'
import { SellerProfileDTO } from '../dtos/seller-profile-dtos'
import { SellerProfile } from '../../enterprise/entities/value-objects/seller-profile'
import { AttachmentMapper } from './attachment-mapper'

@Injectable()
export class SellerProfileMapper {
  constructor(private attachmentMapper: AttachmentMapper) {}

  public toDTO(sellerProfile: SellerProfile): SellerProfileDTO {
    return {
      sellerId: sellerProfile.sellerId.toString(),
      name: sellerProfile.name,
      phone: sellerProfile.phone,
      email: sellerProfile.email,
      avatar: sellerProfile.avatar
        ? this.attachmentMapper.toDTO(sellerProfile.avatar)
        : null,
    }
  }
}
