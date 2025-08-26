import { Injectable } from '@nestjs/common'
import { AttachmentMapper } from './attachment-mapper'
import { ProductDetailsDTO } from '../dtos/product-details-dtos'
import { ProductDetails } from '../../enterprise/entities/value-objects/product-details'
import { SellerProfileMapper } from './seller-profile-mapper'
import { CategoryMapper } from './category-mapper'

@Injectable()
export class ProductDetailsMapper {
  constructor(
    private sellerProfileMapper: SellerProfileMapper,
    private categoryMapper: CategoryMapper,
    private attachmentMapper: AttachmentMapper,
  ) {}

  public toDTO(productDetails: ProductDetails): ProductDetailsDTO {
    return {
      productId: productDetails.productId.toString(),
      title: productDetails.title,
      description: productDetails.description,
      priceInCents: productDetails.priceInCents.value,
      status: productDetails.status.value,
      owner: this.sellerProfileMapper.toDTO(productDetails.owner),
      category: this.categoryMapper.toDTO(productDetails.category),
      attachments: productDetails.attachments.map((attachment) =>
        this.attachmentMapper.toDTO(attachment),
      ),
    }
  }
}
