import { Prisma, Product as PrismaProduct } from '@/generated/prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Product } from '@/domain/marketplace/enterprise/entities/product'
import { PriceInCents } from '@/domain/marketplace/enterprise/entities/value-objects/price-in-cents'
import { ProductStatus } from '@/domain/marketplace/enterprise/entities/value-objects/product-status'
import { PrismaProductStatusMapper } from './prisma-product-status-mapper'

export class PrismaProductMapper {
  static toDomain(raw: PrismaProduct): Product {
    return Product.create(
      {
        title: raw.title,
        categoryId: UniqueEntityID.create({ value: raw.categoryId }),
        description: raw.description,
        priceInCents: PriceInCents.create(raw.priceInCents),
        status: ProductStatus.create(
          PrismaProductStatusMapper.toDomain(raw.status),
        ),
        ownerId: UniqueEntityID.create({ value: raw.ownerId }),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt ?? undefined,
        soldAt: raw.soldAt ?? undefined,
      },
      UniqueEntityID.create({ value: raw.id }),
    )
  }

  static toPrisma(product: Product): Prisma.ProductUncheckedCreateInput {
    return {
      id: product.id.toString(),
      categoryId: product.categoryId.toString(),
      title: product.title,
      description: product.description,
      priceInCents: product.priceInCents.value,
      status: PrismaProductStatusMapper.toPrisma(product.status.value),
      ownerId: product.ownerId.toString(),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      soldAt: product.soldAt,
    }
  }
}
