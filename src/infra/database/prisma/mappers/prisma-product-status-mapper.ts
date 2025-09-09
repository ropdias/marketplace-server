import { $Enums } from '@/generated/prisma/client'
import { ProductStatusEnum } from '@/domain/marketplace/enterprise/entities/value-objects/product-status'

const prismaToDomain: Record<$Enums.ProductStatus, ProductStatusEnum> = {
  AVAILABLE: ProductStatusEnum.AVAILABLE,
  CANCELLED: ProductStatusEnum.CANCELLED,
  SOLD: ProductStatusEnum.SOLD,
}

const domainToPrisma: Record<ProductStatusEnum, $Enums.ProductStatus> = {
  [ProductStatusEnum.AVAILABLE]: 'AVAILABLE',
  [ProductStatusEnum.CANCELLED]: 'CANCELLED',
  [ProductStatusEnum.SOLD]: 'SOLD',
}

export class PrismaProductStatusMapper {
  static toDomain(status: $Enums.ProductStatus): ProductStatusEnum {
    return prismaToDomain[status]
  }

  static toPrisma(status: ProductStatusEnum): $Enums.ProductStatus {
    return domainToPrisma[status]
  }
}
