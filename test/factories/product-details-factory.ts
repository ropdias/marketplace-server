import { Attachment } from '@/domain/marketplace/enterprise/entities/attachment'
import { Category } from '@/domain/marketplace/enterprise/entities/category'
import { Product } from '@/domain/marketplace/enterprise/entities/product'
import { ProductDetails } from '@/domain/marketplace/enterprise/entities/value-objects/product-details'
import { SellerProfile } from '@/domain/marketplace/enterprise/entities/value-objects/seller-profile'

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
