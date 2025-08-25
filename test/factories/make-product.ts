import { faker } from '@faker-js/faker'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Product,
  ProductProps,
} from '@/domain/marketplace/enterprise/entities/product'
import { PriceInCents } from '@/domain/marketplace/enterprise/entities/value-objects/price-in-cents'

export function makeProduct(
  override: Partial<ProductProps> = {},
  id?: UniqueEntityID,
) {
  const product = Product.create(
    {
      title: faker.commerce.productName(),
      categoryId: UniqueEntityID.create(),
      description: faker.commerce.productDescription(),
      priceInCents: PriceInCents.create(
        Math.floor(Number(faker.commerce.price()) * 100),
      ),
      ownerId: UniqueEntityID.create(),
      ...override, // we will override any props that have been passed to make this entity
    },
    id,
  )

  return product
}
