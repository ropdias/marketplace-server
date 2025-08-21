import { Injectable } from '@nestjs/common'
import { ProductDetails } from '../../enterprise/entities/value-objects/product-details'
import { Product } from '../../enterprise/entities/product'
import { SellerProfileFactory } from './seller-profile-factory'
import { Seller } from '../../enterprise/entities/seller'
import { Category } from '../../enterprise/entities/category'
import { Attachment } from '../../enterprise/entities/attachment'

interface ProductDetailsFactoryCreateRequest {
  product: Product
  seller: Seller
  category: Category
  attachments: Attachment[]
}

@Injectable()
export class ProductDetailsFactory {
  constructor(private sellerProfileFactory: SellerProfileFactory) {}

  async create({
    product,
    seller,
    category,
    attachments,
  }: ProductDetailsFactoryCreateRequest): Promise<ProductDetails> {
    const sellerProfile = await this.sellerProfileFactory.create({
      seller,
    })

    return ProductDetails.create({
      productId: product.id,
      title: product.title,
      description: product.description,
      priceInCents: product.priceInCents,
      status: product.status,
      owner: sellerProfile,
      category: category,
      attachments: attachments,
    })
  }
}
