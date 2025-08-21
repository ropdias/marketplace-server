import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ValueObject } from '@/core/entities/value-object'
import { Attachment } from '../attachment'
import { PriceInCents } from './price-in-cents'
import { ProductStatus } from './product-status'
import { SellerProfile } from './seller-profile'
import { Category } from '../category'

export interface ProductDetailsProps {
  productId: UniqueEntityID
  title: string
  description: string
  priceInCents: PriceInCents
  status: ProductStatus
  owner: SellerProfile
  category: Category
  attachments: Attachment[]
}

export class ProductDetails extends ValueObject<ProductDetailsProps> {
  get productId() {
    return this.props.productId
  }

  get title() {
    return this.props.title
  }

  get description() {
    return this.props.description
  }

  get priceInCents() {
    return this.props.priceInCents
  }

  get status() {
    return this.props.status
  }

  get owner() {
    return this.props.owner
  }

  get category() {
    return this.props.category
  }

  get attachments() {
    return this.props.attachments
  }

  static create(props: ProductDetailsProps) {
    return new ProductDetails(props)
  }
}
