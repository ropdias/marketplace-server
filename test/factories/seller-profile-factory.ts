import { Attachment } from '@/domain/marketplace/enterprise/entities/attachment'
import { Seller } from '@/domain/marketplace/enterprise/entities/seller'
import { SellerProfile } from '@/domain/marketplace/enterprise/entities/value-objects/seller-profile'

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
