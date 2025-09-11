import { SellerProfileDTO } from '../dtos/seller-profile-dtos'
import { SellerProfile } from '../../enterprise/entities/value-objects/seller-profile'
import { AttachmentMapper } from './attachment-mapper'

export class SellerProfileMapper {
  static toDTO(sellerProfile: SellerProfile): SellerProfileDTO {
    return {
      sellerId: sellerProfile.sellerId.toString(),
      name: sellerProfile.name,
      phone: sellerProfile.phone,
      email: sellerProfile.email,
      avatar: sellerProfile.avatar
        ? AttachmentMapper.toDTO(sellerProfile.avatar)
        : null,
    }
  }
}
