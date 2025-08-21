import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { AggregateRoot } from '@/core/entities/aggregate-root'
import { Category } from './category'
import { ProductAttachmentList } from './product-attachment-list'
import { Seller } from './seller'
import {
  ProductStatus,
  ProductStatusEnum,
} from './value-objects/product-status'
import { Optional } from '@/core/types/optional'

interface ProductProps {
  title: string
  category: Category
  description: string
  priceInCents: number
  attachments: ProductAttachmentList
  status: ProductStatus
  owner: Seller
}

export class Product extends AggregateRoot<ProductProps> {
  get title() {
    return this.props.title
  }

  set title(title: string) {
    this.props.title = title
  }

  get category() {
    return this.props.category
  }

  set category(category: Category) {
    this.props.category = category
  }

  get description() {
    return this.props.description
  }

  set description(description: string) {
    this.props.description = description
  }

  get priceInCents() {
    return this.props.priceInCents
  }

  set priceInCents(priceInCents: number) {
    this.props.priceInCents = priceInCents
  }

  get attachments() {
    return this.props.attachments
  }

  set attachments(attachments: ProductAttachmentList) {
    this.props.attachments = attachments
  }

  get status() {
    return this.props.status
  }

  set status(status: ProductStatus) {
    this.props.status = status
  }

  static create(
    props: Optional<ProductProps, 'status' | 'attachments'>,
    id?: UniqueEntityID,
  ) {
    const product = new Product(
      {
        ...props,
        status:
          props.status ?? ProductStatus.create(ProductStatusEnum.AVAILABLE),
        attachments: props.attachments ?? new ProductAttachmentList(),
      },
      id,
    )

    return product
  }
}
