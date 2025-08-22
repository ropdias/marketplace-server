import { faker } from '@faker-js/faker'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Category,
  CategoryProps,
} from '@/domain/marketplace/enterprise/entities/category'

export function makeCategory(
  override: Partial<CategoryProps> = {},
  id?: UniqueEntityID,
) {
  const category = Category.create(
    {
      title: faker.lorem.sentence(4),
      ...override, // we will override any props that have been passed to make this entity
    },
    id,
  )

  return category
}
