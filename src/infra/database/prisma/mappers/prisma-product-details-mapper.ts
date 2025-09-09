import {
  Attachment as PrismaAttachment,
  Product as PrismaProduct,
  Category as PrismaCategory,
  Seller as PrismaSeller,
} from '@/generated/prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { PrismaAttachmentMapper } from './prisma-attachment-mapper'
import { PrismaSellerProfileMapper } from './prisma-seller-profile-mapper'
import { ProductDetails } from '@/domain/marketplace/enterprise/entities/value-objects/product-details'
import { PriceInCents } from '@/domain/marketplace/enterprise/entities/value-objects/price-in-cents'
import { ProductStatus } from '@/domain/marketplace/enterprise/entities/value-objects/product-status'
import { PrismaProductStatusMapper } from './prisma-product-status-mapper'
import { PrismaCategoryMapper } from './prisma-category-mapper'

type PrismaProductDetails = PrismaProduct & {
  category: PrismaCategory
  attachments: PrismaAttachment[]
  owner: PrismaSeller & {
    avatar: PrismaAttachment | null
  }
}

export class PrismaProductDetailsMapper {
  static toDomain(raw: PrismaProductDetails): ProductDetails {
    return ProductDetails.create({
      productId: UniqueEntityID.create({ value: raw.id }),
      title: raw.title,
      description: raw.description,
      priceInCents: PriceInCents.create(raw.priceInCents),
      status: ProductStatus.create(
        PrismaProductStatusMapper.toDomain(raw.status),
      ),
      owner: PrismaSellerProfileMapper.toDomain(raw.owner),
      category: PrismaCategoryMapper.toDomain(raw.category),
      attachments: raw.attachments.map((attachment) =>
        PrismaAttachmentMapper.toDomain(attachment),
      ),
    })
  }
}
