import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { AggregateRoot } from '@/core/entities/aggregate-root'
import { ProductAttachmentList } from './product-attachment-list'
import {
  ProductStatus,
  ProductStatusEnum,
} from './value-objects/product-status'
import { Optional } from '@/core/types/optional'
import { PriceInCents } from './value-objects/price-in-cents'

export interface ProductProps {
  title: string
  categoryId: UniqueEntityID
  description: string
  priceInCents: PriceInCents
  attachments: ProductAttachmentList
  status: ProductStatus
  ownerId: UniqueEntityID
  createdAt: Date
  updatedAt?: Date
  soldAt?: Date
}

export class Product extends AggregateRoot<ProductProps> {
  get title() {
    return this.props.title
  }

  set title(title: string) {
    this.props.title = title
    this.touch()
  }

  get categoryId() {
    return this.props.categoryId
  }

  set categoryId(categoryId: UniqueEntityID) {
    this.props.categoryId = categoryId
    this.touch()
  }

  get description() {
    return this.props.description
  }

  set description(description: string) {
    this.props.description = description
    this.touch()
  }

  get priceInCents() {
    return this.props.priceInCents
  }

  set priceInCents(priceInCents: PriceInCents) {
    this.props.priceInCents = priceInCents
    this.touch()
  }

  get attachments() {
    return this.props.attachments
  }

  set attachments(attachments: ProductAttachmentList) {
    this.props.attachments = attachments
    this.touch()
  }

  get status() {
    return this.props.status
  }

  set status(status: ProductStatus) {
    this.props.status = status
    this.touch()

    if (status.value === ProductStatusEnum.SOLD) {
      this.markAsSold()
    } else {
      this.clearSoldAt()
    }
  }

  get ownerId() {
    return this.props.ownerId
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  get soldAt() {
    return this.props.soldAt
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  private markAsSold() {
    this.props.soldAt = new Date()
  }

  private clearSoldAt() {
    this.props.soldAt = undefined
  }

  static create(
    props: Optional<ProductProps, 'status' | 'attachments' | 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    const product = new Product(
      {
        ...props,
        status:
          props.status ?? ProductStatus.create(ProductStatusEnum.AVAILABLE),
        attachments: props.attachments ?? new ProductAttachmentList(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return product
  }
}
