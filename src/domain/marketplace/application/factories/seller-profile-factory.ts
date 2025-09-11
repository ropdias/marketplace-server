import { Seller } from '../../enterprise/entities/seller'
import { SellerProfile } from '../../enterprise/entities/value-objects/seller-profile'
import { Attachment } from '../../enterprise/entities/attachment'

interface SellerProfileFactoryCreateRequest {
  seller: Seller
  avatar: Attachment | null
}

export class SellerProfileFactory {
  static create({
    seller,
    avatar,
  }: SellerProfileFactoryCreateRequest): SellerProfile {
    return SellerProfile.create({
      sellerId: seller.id,
      name: seller.name,
      phone: seller.phone,
      email: seller.email,
      avatar,
    })
  }
}
