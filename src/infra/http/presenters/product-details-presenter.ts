import { ProductDetailsDTO } from '@/domain/marketplace/application/dtos/product-details-dtos'
import {
  SellerProfileDTOResponse,
  sellerProfileDTOSchema,
} from './seller-profile-presenter'
import { CategoryDTOResponse, categoryDTOSchema } from './category-presenter'
import {
  AttachmentDTOResponse,
  attachmentDTOSchema,
} from './attachment-presenter'
import { ApiProperty } from '@nestjs/swagger'
import { ProductStatusEnum } from '@/domain/marketplace/enterprise/entities/value-objects/product-status'
import { z } from 'zod'

export const productDetailsDTOSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string(),
  priceInCents: z.number().nonnegative(),
  status: z.string(),
  owner: sellerProfileDTOSchema,
  category: categoryDTOSchema,
  attachments: z.array(attachmentDTOSchema),
})

export type ProductDetailsDTOResponseType = z.infer<
  typeof productDetailsDTOSchema
>

export const productDetailsResponseSchema = z.object({
  product: productDetailsDTOSchema,
})

export type ProductDetailsResponseType = z.infer<
  typeof productDetailsResponseSchema
>

export const productDetailsListResponseSchema = z.object({
  products: z.array(productDetailsDTOSchema),
})

export type ProductDetailsListResponseType = z.infer<
  typeof productDetailsListResponseSchema
>

export class ProductDetailsDTOResponse
  implements ProductDetailsDTOResponseType
{
  @ApiProperty({ format: 'uuid' }) id: string
  @ApiProperty() title: string
  @ApiProperty() description: string
  @ApiProperty({ default: 1 }) priceInCents: number
  @ApiProperty({ enum: ProductStatusEnum }) status: string
  @ApiProperty({ type: SellerProfileDTOResponse })
  owner: SellerProfileDTOResponse
  @ApiProperty({ type: CategoryDTOResponse })
  category: CategoryDTOResponse
  @ApiProperty({ type: [AttachmentDTOResponse] })
  attachments: AttachmentDTOResponse[]

  constructor(
    productDetails: ProductDetailsDTO,
    bucketName: string,
    region: string,
  ) {
    this.id = productDetails.productId
    this.title = productDetails.title
    this.description = productDetails.description
    this.priceInCents = productDetails.priceInCents
    this.status = productDetails.status
    this.owner = new SellerProfileDTOResponse(
      productDetails.owner,
      bucketName,
      region,
    )
    this.category = new CategoryDTOResponse(productDetails.category)
    this.attachments = productDetails.attachments.map(
      (attachment) => new AttachmentDTOResponse(attachment, bucketName, region),
    )
  }
}

export class ProductDetailsResponse implements ProductDetailsResponseType {
  @ApiProperty({ type: ProductDetailsDTOResponse })
  product: ProductDetailsDTOResponse

  constructor(dto: ProductDetailsDTO, bucketName: string, region: string) {
    this.product = new ProductDetailsDTOResponse(dto, bucketName, region)
  }
}

export class ProductDetailsListResponse
  implements ProductDetailsListResponseType
{
  @ApiProperty({ type: [ProductDetailsDTOResponse] })
  products: ProductDetailsDTOResponse[]

  constructor(dtos: ProductDetailsDTO[], bucketName: string, region: string) {
    this.products = dtos.map(
      (dto) => new ProductDetailsDTOResponse(dto, bucketName, region),
    )
  }
}

export class ProductDetailsPresenter {
  static toHTTP(
    dto: ProductDetailsDTO,
    bucketName: string,
    region: string,
  ): ProductDetailsResponse {
    return new ProductDetailsResponse(dto, bucketName, region)
  }

  static toHTTPMany(
    dtos: ProductDetailsDTO[],
    bucketName: string,
    region: string,
  ): ProductDetailsListResponse {
    return new ProductDetailsListResponse(dtos, bucketName, region)
  }
}
