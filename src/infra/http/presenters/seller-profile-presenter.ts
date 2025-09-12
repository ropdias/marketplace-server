import { ApiProperty } from '@nestjs/swagger'
import type { SellerProfileDTO } from '@/domain/marketplace/application/dtos/seller-profile-dtos'
import { AttachmentDTOResponse } from './attachment-presenter'

export class SellerProfileDTOResponse {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty()
  name: string

  @ApiProperty({ format: 'email' })
  email: string

  @ApiProperty()
  phone: string

  @ApiProperty({
    type: AttachmentDTOResponse,
    nullable: true,
  })
  avatar: AttachmentDTOResponse | null

  constructor(sellerProfile: SellerProfileDTO) {
    this.id = sellerProfile.sellerId
    this.name = sellerProfile.name
    this.email = sellerProfile.email
    this.phone = sellerProfile.phone
    this.avatar = sellerProfile.avatar
      ? new AttachmentDTOResponse(sellerProfile.avatar)
      : null
  }
}

export class SellerProfileResponse {
  @ApiProperty({
    type: SellerProfileDTOResponse,
  })
  seller: SellerProfileDTOResponse

  constructor(dto: SellerProfileDTO) {
    this.seller = new SellerProfileDTOResponse(dto)
  }
}

export class SellerProfilePresenter {
  static toHTTP(dto: SellerProfileDTO): SellerProfileResponse {
    return new SellerProfileResponse(dto)
  }
}
