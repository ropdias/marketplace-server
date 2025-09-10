import { ProductDetailsDTO } from '@/domain/marketplace/application/dtos/product-details-dtos'
import { SellerProfilePresenter } from './seller-profile-presenter'
import { CategoryPresenter } from './category-presenter'
import { AttachmentPresenter } from './attachment-presenter'

export class ProductDetailsPresenter {
  static toHTTP(productDetails: ProductDetailsDTO) {
    return {
      id: productDetails.productId,
      title: productDetails.title,
      description: productDetails.description,
      priceInCents: productDetails.priceInCents,
      status: productDetails.status,
      owner: SellerProfilePresenter.toHTTP(productDetails.owner),
      category: CategoryPresenter.toHTTP(productDetails.category),
      attachments: productDetails.attachments.map((attachment) =>
        AttachmentPresenter.toHTTP(attachment),
      ),
    }
  }
}
