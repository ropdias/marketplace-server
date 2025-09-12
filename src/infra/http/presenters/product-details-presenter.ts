import { ProductDetailsDTO } from '@/domain/marketplace/application/dtos/product-details-dtos'
import { SellerProfileDTOResponse } from './seller-profile-presenter'
import { CategoryDTOResponse } from './category-presenter'
import { AttachmentDTOResponse } from './attachment-presenter'
import { ApiProperty } from '@nestjs/swagger'

export class ProductDetailsDTOResponse {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty()
  title: string

  @ApiProperty()
  description: string

  @ApiProperty({ default: 1 })
  priceInCents: number

  @ApiProperty({ default: 'available' })
  status: string

  @ApiProperty({ type: SellerProfileDTOResponse })
  owner: SellerProfileDTOResponse

  @ApiProperty({ type: CategoryDTOResponse })
  category: CategoryDTOResponse

  @ApiProperty({
    type: [AttachmentDTOResponse],
  })
  attachments: AttachmentDTOResponse[]

  constructor(productDetails: ProductDetailsDTO) {
    this.id = productDetails.productId
    this.title = productDetails.title
    this.description = productDetails.description
    this.priceInCents = productDetails.priceInCents
    this.status = productDetails.status
    this.owner = new SellerProfileDTOResponse(productDetails.owner)
    this.category = new CategoryDTOResponse(productDetails.category)
    this.attachments = productDetails.attachments.map(
      (attachment) => new AttachmentDTOResponse(attachment),
    )
  }
}

export class ProductDetailsResponse {
  @ApiProperty({
    type: ProductDetailsDTOResponse,
  })
  product: ProductDetailsDTOResponse

  constructor(dto: ProductDetailsDTO) {
    this.product = new ProductDetailsDTOResponse(dto)
  }
}

export class ProductDetailsListResponse {
  @ApiProperty({
    type: [ProductDetailsDTOResponse],
  })
  products: ProductDetailsDTOResponse[]

  constructor(dtos: ProductDetailsDTO[]) {
    this.products = dtos.map((dto) => new ProductDetailsDTOResponse(dto))
  }
}

export class ProductDetailsPresenter {
  static toHTTP(dto: ProductDetailsDTO): ProductDetailsResponse {
    return new ProductDetailsResponse(dto)
  }

  static toHTTPList(dtos: ProductDetailsDTO[]): ProductDetailsListResponse {
    return new ProductDetailsListResponse(dtos)
  }
}
