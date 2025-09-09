import {
  Seller as PrismaSeller,
  Attachment as PrismaAttachment,
} from '@/generated/prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { SellerProfile } from '@/domain/marketplace/enterprise/entities/value-objects/seller-profile'
import { PrismaAttachmentMapper } from './prisma-attachment-mapper'

export type PrismaSellerProfile = PrismaSeller & {
  avatar: PrismaAttachment | null
}

export class PrismaSellerProfileMapper {
  static toDomain(raw: PrismaSellerProfile): SellerProfile {
    return SellerProfile.create({
      sellerId: UniqueEntityID.create({ value: raw.id }),
      name: raw.name,
      phone: raw.phone,
      email: raw.email,
      avatar: raw.avatar ? PrismaAttachmentMapper.toDomain(raw.avatar) : null,
    })
  }
}
