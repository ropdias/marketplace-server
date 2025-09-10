import { faker } from '@faker-js/faker'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  ProductView,
  ProductViewProps,
} from '@/domain/marketplace/enterprise/entities/product-view'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaProductViewMapper } from '@/infra/database/prisma/mappers/prisma-product-view-mapper'

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

@Injectable()
export class ProductViewFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaProductView(
    data: Partial<ProductViewProps> = {},
  ): Promise<ProductView> {
    const productView = makeProductView(data)

    await this.prisma.productView.create({
      data: PrismaProductViewMapper.toPrisma(productView),
    })

    return productView
  }
}
