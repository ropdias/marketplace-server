import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { AggregateRoot } from '@/core/entities/aggregate-root'
import { ProductAttachmentList } from './product-attachment-list'
import {
  ProductStatus,
  ProductStatusEnum,
} from './value-objects/product-status'
import { Optional } from '@/core/types/optional'
import { PriceInCents } from './value-objects/price-in-cents'

interface ProductProps {
  title: string
  categoryId: UniqueEntityID
  description: string
  priceInCents: PriceInCents
  attachments: ProductAttachmentList
  status: ProductStatus
  ownerId: UniqueEntityID
}

export class Product extends AggregateRoot<ProductProps> {
  get title() {
    return this.props.title
  }

  set title(title: string) {
    this.props.title = title
  }

  get categoryId() {
    return this.props.categoryId
  }

  set categoryId(categoryId: UniqueEntityID) {
    this.props.categoryId = categoryId
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

  set priceInCents(priceInCents: PriceInCents) {
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

  get ownerId() {
    return this.props.ownerId
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
