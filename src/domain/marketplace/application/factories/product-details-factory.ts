import { ProductDetails } from '../../enterprise/entities/value-objects/product-details'
import { Product } from '../../enterprise/entities/product'
import { Category } from '../../enterprise/entities/category'
import { Attachment } from '../../enterprise/entities/attachment'
import { SellerProfile } from '../../enterprise/entities/value-objects/seller-profile'

interface ProductDetailsFactoryCreateRequest {
  product: Product
  ownerProfile: SellerProfile
  category: Category
  attachments: Attachment[]
}

export class ProductDetailsFactory {
  static create({
    product,
    ownerProfile,
    category,
    attachments,
  }: ProductDetailsFactoryCreateRequest): ProductDetails {
    return ProductDetails.create({
      productId: product.id,
      title: product.title,
      description: product.description,
      priceInCents: product.priceInCents,
      status: product.status,
      owner: ownerProfile,
      category: category,
      attachments: attachments,
    })
  }
}
