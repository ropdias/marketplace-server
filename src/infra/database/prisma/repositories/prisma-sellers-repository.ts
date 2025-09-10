import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { SellersRepository } from '@/domain/marketplace/application/repositories/sellers-repository'
import { Seller } from '@/domain/marketplace/enterprise/entities/seller'
import { PrismaSellerMapper } from '../mappers/prisma-seller-mapper'

@Injectable()
export class PrismaSellersRepository implements SellersRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<Seller | null> {
    const seller = await this.prisma.seller.findUnique({
      where: { email },
    })

    if (!seller) return null

    return PrismaSellerMapper.toDomain(seller)
  }

  async findById(id: string): Promise<Seller | null> {
    const seller = await this.prisma.seller.findUnique({
      where: { id },
    })

    if (!seller) return null

    return PrismaSellerMapper.toDomain(seller)
  }

  async findByPhone(phone: string): Promise<Seller | null> {
    const seller = await this.prisma.seller.findUnique({
      where: { phone },
    })

    if (!seller) return null

    return PrismaSellerMapper.toDomain(seller)
  }

  async findManyByIds(ids: string[]): Promise<Seller[]> {
    const sellers = await this.prisma.seller.findMany({
      where: { id: { in: ids } },
    })

    return sellers.map((seller) => PrismaSellerMapper.toDomain(seller))
  }

  async create(seller: Seller): Promise<void> {
    const data = PrismaSellerMapper.toPrisma(seller)
    await this.prisma.seller.create({ data })
  }

  async save(seller: Seller): Promise<void> {
    const data = PrismaSellerMapper.toPrisma(seller)
    await this.prisma.seller.update({
      where: { id: seller.id.toString() },
      data,
    })
  }
}
