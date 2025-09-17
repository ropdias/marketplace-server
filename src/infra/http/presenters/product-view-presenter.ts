import { ApiProperty } from '@nestjs/swagger'
import {
  SellerProfileDTOResponse,
  sellerProfileDTOSchema,
} from './seller-profile-presenter'
import { ProductDetailsDTO } from '@/domain/marketplace/application/dtos/product-details-dtos'
import {
  ProductDetailsDTOResponse,
  productDetailsDTOSchema,
} from './product-details-presenter'
import { SellerProfileDTO } from '@/domain/marketplace/application/dtos/seller-profile-dtos'
import { z } from 'zod'

export const productViewResponseSchema = z.object({
  product: productDetailsDTOSchema,
  viewer: sellerProfileDTOSchema,
})

export type ProductViewResponseType = z.infer<typeof productViewResponseSchema>

export class ProductViewResponse implements ProductViewResponseType {
  @ApiProperty({ type: ProductDetailsDTOResponse })
  product: ProductDetailsDTOResponse

  @ApiProperty({ type: SellerProfileDTOResponse })
  viewer: SellerProfileDTOResponse

  constructor({
    productDetails,
    viewerProfile,
    bucketName,
    region,
  }: {
    productDetails: ProductDetailsDTO
    viewerProfile: SellerProfileDTO
    bucketName: string
    region: string
  }) {
    this.product = new ProductDetailsDTOResponse(
      productDetails,
      bucketName,
      region,
    )
    this.viewer = new SellerProfileDTOResponse(
      viewerProfile,
      bucketName,
      region,
    )
  }
}

export class ProductViewPresenter {
  static toHTTP({
    productDetails,
    viewerProfile,
    bucketName,
    region,
  }: {
    productDetails: ProductDetailsDTO
    viewerProfile: SellerProfileDTO
    bucketName: string
    region: string
  }): ProductViewResponse {
    return new ProductViewResponse({
      productDetails,
      viewerProfile,
      bucketName,
      region,
    })
  }
}
