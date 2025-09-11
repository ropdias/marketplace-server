import { AttachmentMapper } from './attachment-mapper'
import { ProductDetailsDTO } from '../dtos/product-details-dtos'
import { ProductDetails } from '../../enterprise/entities/value-objects/product-details'
import { SellerProfileMapper } from './seller-profile-mapper'
import { CategoryMapper } from './category-mapper'

export class ProductDetailsMapper {
  static toDTO(productDetails: ProductDetails): ProductDetailsDTO {
    return {
      productId: productDetails.productId.toString(),
      title: productDetails.title,
      description: productDetails.description,
      priceInCents: productDetails.priceInCents.value,
      status: productDetails.status.value,
      owner: SellerProfileMapper.toDTO(productDetails.owner),
      category: CategoryMapper.toDTO(productDetails.category),
      attachments: productDetails.attachments.map((attachment) =>
        AttachmentMapper.toDTO(attachment),
      ),
    }
  }
}
