import { faker } from '@faker-js/faker'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Product,
  ProductProps,
} from '@/domain/marketplace/enterprise/entities/product'
import { PriceInCents } from '@/domain/marketplace/enterprise/entities/value-objects/price-in-cents'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaProductMapper } from '@/infra/database/prisma/mappers/prisma-product-mapper'

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

@Injectable()
export class ProductFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaProduct(data: Partial<ProductProps> = {}): Promise<Product> {
    const product = makeProduct(data)

    await this.prisma.product.create({
      data: PrismaProductMapper.toPrisma(product),
    })

    return product
  }
}
