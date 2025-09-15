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
  }: {
    productDetails: ProductDetailsDTO
    viewerProfile: SellerProfileDTO
  }) {
    this.product = new ProductDetailsDTOResponse(productDetails)
    this.viewer = new SellerProfileDTOResponse(viewerProfile)
  }
}

export class ProductViewPresenter {
  static toHTTP({
    productDetails,
    viewerProfile,
  }: {
    productDetails: ProductDetailsDTO
    viewerProfile: SellerProfileDTO
  }): ProductViewResponse {
    return new ProductViewResponse({
      productDetails,
      viewerProfile,
    })
  }
}
