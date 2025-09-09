import { Prisma, Seller as PrismaSeller } from '@/generated/prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Seller } from '@/domain/marketplace/enterprise/entities/seller'

export class PrismaSellerMapper {
  static toDomain(raw: PrismaSeller): Seller {
    return Seller.create(
      {
        name: raw.name,
        phone: raw.phone,
        email: raw.email,
        password: raw.password,
        avatarId: raw.avatarId
          ? UniqueEntityID.create({ value: raw.avatarId })
          : null,
      },
      UniqueEntityID.create({ value: raw.id }),
    )
  }

  static toPrisma(seller: Seller): Prisma.SellerUncheckedCreateInput {
    return {
      id: seller.id.toString(),
      name: seller.name,
      phone: seller.phone,
      email: seller.email,
      password: seller.password,
      avatarId: seller.avatarId?.toString() || null,
    }
  }
}
