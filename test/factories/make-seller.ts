import { faker } from '@faker-js/faker'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Seller,
  SellerProps,
} from '@/domain/marketplace/enterprise/entities/seller'

export function makeSeller(
  override: Partial<SellerProps> = {},
  id?: UniqueEntityID,
) {
  const seller = Seller.create(
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      password: faker.internet.password(),
      avatarId: null,
      ...override, // we will override any props that have been passed to make this entity
    },
    id,
  )

  return seller
}
