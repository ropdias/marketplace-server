import { faker } from '@faker-js/faker'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  ProductView,
  ProductViewProps,
} from '@/domain/marketplace/enterprise/entities/product-view'

export function makeProductView(
  override: Partial<ProductViewProps> = {},
  id?: UniqueEntityID,
) {
  const productView = ProductView.create(
    {
      productId: UniqueEntityID.create(),
      viewerId: UniqueEntityID.create(),
      createdAt: faker.date.past(),
      ...override, // we will override any props that have been passed to make this entity
    },
    id,
  )

  return productView
}
