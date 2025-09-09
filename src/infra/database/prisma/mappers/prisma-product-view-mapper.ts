import {
  Prisma,
  ProductView as PrismaProductView,
} from '@/generated/prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ProductView } from '@/domain/marketplace/enterprise/entities/product-view'

export class PrismaProductViewMapper {
  static toDomain(raw: PrismaProductView): ProductView {
    return ProductView.create(
      {
        productId: UniqueEntityID.create({ value: raw.productId }),
        viewerId: UniqueEntityID.create({ value: raw.viewerId }),
        createdAt: raw.createdAt,
      },
      UniqueEntityID.create({ value: raw.id }),
    )
  }

  static toPrisma(
    productView: ProductView,
  ): Prisma.ProductViewUncheckedCreateInput {
    return {
      id: productView.id.toString(),
      productId: productView.productId.toString(),
      viewerId: productView.viewerId.toString(),
      createdAt: productView.createdAt,
    }
  }
}
