import { SellerProfileDTO } from '@/domain/marketplace/application/dtos/seller-profile-dtos'
import { AttachmentPresenter } from './attachment-presenter'

export class SellerProfilePresenter {
  static toHTTP(sellerProfile: SellerProfileDTO) {
    return {
      id: sellerProfile.sellerId,
      name: sellerProfile.name,
      phone: sellerProfile.phone,
      email: sellerProfile.email,
      avatar: sellerProfile.avatar
        ? AttachmentPresenter.toHTTP(sellerProfile.avatar)
        : null,
    }
  }
}
