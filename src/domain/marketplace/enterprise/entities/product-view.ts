import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { dayjs } from '@/core/libs/dayjs'

export interface ProductViewProps {
  productId: UniqueEntityID
  viewerId: UniqueEntityID
  createdAt: Date
}

export class ProductView extends Entity<ProductViewProps> {
  get productId() {
    return this.props.productId
  }

  get viewerId() {
    return this.props.viewerId
  }

  get createdAt() {
    return this.props.createdAt
  }

  static create(
    props: Optional<ProductViewProps, 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    const productView = new ProductView(
      { ...props, createdAt: props.createdAt ?? dayjs.utc().toDate() },
      id,
    )

    return productView
  }
}
