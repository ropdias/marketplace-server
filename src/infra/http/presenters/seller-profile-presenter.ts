import { ApiProperty } from '@nestjs/swagger'
import type { SellerProfileDTO } from '@/domain/marketplace/application/dtos/seller-profile-dtos'
import {
  AttachmentDTOResponse,
  attachmentDTOSchema,
} from './attachment-presenter'
import { z } from 'zod'

export const sellerProfileDTOSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  phone: z.string(),
  avatar: attachmentDTOSchema.nullable(),
})

export type SellerProfileDTOResponseType = z.infer<
  typeof sellerProfileDTOSchema
>

export const sellerProfileResponseSchema = z.object({
  seller: sellerProfileDTOSchema,
})

export type SellerProfileResponseType = z.infer<
  typeof sellerProfileResponseSchema
>

export class SellerProfileDTOResponse implements SellerProfileDTOResponseType {
  @ApiProperty({ format: 'uuid' }) id: string
  @ApiProperty() name: string
  @ApiProperty({ format: 'email' }) email: string
  @ApiProperty() phone: string
  @ApiProperty({
    type: AttachmentDTOResponse,
    nullable: true,
  })
  avatar: AttachmentDTOResponse | null

  constructor(
    sellerProfile: SellerProfileDTO,
    bucketName: string,
    region: string,
  ) {
    this.id = sellerProfile.sellerId
    this.name = sellerProfile.name
    this.email = sellerProfile.email
    this.phone = sellerProfile.phone
    this.avatar = sellerProfile.avatar
      ? new AttachmentDTOResponse(sellerProfile.avatar, bucketName, region)
      : null
  }
}

export class SellerProfileResponse implements SellerProfileResponseType {
  @ApiProperty({ type: SellerProfileDTOResponse })
  seller: SellerProfileDTOResponse

  constructor(dto: SellerProfileDTO, bucketName: string, region: string) {
    this.seller = new SellerProfileDTOResponse(dto, bucketName, region)
  }
}

export class SellerProfilePresenter {
  static toHTTP(
    dto: SellerProfileDTO,
    bucketName: string,
    region: string,
  ): SellerProfileResponse {
    return new SellerProfileResponse(dto, bucketName, region)
  }
}
