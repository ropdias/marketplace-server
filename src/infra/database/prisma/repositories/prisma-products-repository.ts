import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import {
  FindManyProductDetailsBySellerIdParams,
  FindManyRecentProductDetailsParams,
  ProductsRepository,
} from '@/domain/marketplace/application/repositories/products-repository'
import { Product } from '@/domain/marketplace/enterprise/entities/product'
import { PrismaProductMapper } from '../mappers/prisma-product-mapper'
import { PrismaProductStatusMapper } from '../mappers/prisma-product-status-mapper'
import { ProductStatusEnum } from '@/domain/marketplace/enterprise/entities/value-objects/product-status'
import { ProductAttachmentsRepository } from '@/domain/marketplace/application/repositories/product-attachments-repository'
import { ProductDetails } from '@/domain/marketplace/enterprise/entities/value-objects/product-details'
import { PrismaProductDetailsMapper } from '../mappers/prisma-product-details-mapper'

@Injectable()
export class PrismaProductsRepository implements ProductsRepository {
  constructor(
    private prisma: PrismaService,
    private productAttachmentsRepository: ProductAttachmentsRepository,
  ) {}

  async findById(id: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    })

    if (!product) return null

    return PrismaProductMapper.toDomain(product)
  }

  async findManyBySellerId(sellerId: string): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: { ownerId: sellerId },
    })

    return products.map((product) => PrismaProductMapper.toDomain(product))
  }

  async save(product: Product): Promise<void> {
    const data = PrismaProductMapper.toPrisma(product)

    await Promise.all([
      this.prisma.product.update({
        where: {
          id: product.id.toString(),
        },
        data,
      }),
      this.productAttachmentsRepository.updateMany(
        product.attachments.getNewItems(),
      ),
      this.productAttachmentsRepository.deleteMany(
        product.attachments.getRemovedItems(),
      ),
    ])
  }

  async create(product: Product): Promise<void> {
    const data = PrismaProductMapper.toPrisma(product)
    await this.prisma.product.create({ data })

    await this.productAttachmentsRepository.updateMany(
      product.attachments.getItems(),
    )
  }

  async countSoldSince({
    ownerId,
    since,
  }: {
    ownerId: string
    since: Date
  }): Promise<number> {
    return this.prisma.product.count({
      where: {
        ownerId,
        status: PrismaProductStatusMapper.toPrisma(ProductStatusEnum.SOLD),
        soldAt: {
          gte: since,
        },
      },
    })
  }

  async countAvailableSince({
    ownerId,
    since,
  }: {
    ownerId: string
    since: Date
  }): Promise<number> {
    return this.prisma.product.count({
      where: {
        ownerId,
        status: PrismaProductStatusMapper.toPrisma(ProductStatusEnum.AVAILABLE),
        createdAt: {
          gte: since,
        },
      },
    })
  }

  async findProductDetailsById(id: string): Promise<ProductDetails | null> {
    const productDetails = await this.prisma.product.findUnique({
      where: { id },
      include: {
        attachments: true,
        owner: { include: { avatar: true } },
        category: true,
      },
    })

    if (!productDetails) return null

    return PrismaProductDetailsMapper.toDomain(productDetails)
  }

  async findManyRecentProductDetailsByIds({
    page,
    search,
    status,
  }: FindManyRecentProductDetailsParams): Promise<ProductDetails[]> {
    const products = await this.prisma.product.findMany({
      where: {
        ...(search ? { title: { contains: search } } : {}),
        ...(status
          ? { status: PrismaProductStatusMapper.toPrisma(status.value) }
          : {}),
      },
      include: {
        attachments: true,
        owner: { include: { avatar: true } },
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      ...(page
        ? {
            take: 20,
            skip: (page - 1) * 20,
          }
        : {}),
    })

    return products.map((product) =>
      PrismaProductDetailsMapper.toDomain(product),
    )
  }

  async findManyProductDetailsBySellerId({
    sellerId,
    search,
    status,
  }: FindManyProductDetailsBySellerIdParams): Promise<ProductDetails[]> {
    const products = await this.prisma.product.findMany({
      where: {
        ownerId: sellerId,
        ...(search ? { title: { contains: search } } : {}),
        ...(status
          ? { status: PrismaProductStatusMapper.toPrisma(status.value) }
          : {}),
      },
      include: {
        attachments: true,
        owner: { include: { avatar: true } },
        category: true,
      },
    })

    return products.map((product) =>
      PrismaProductDetailsMapper.toDomain(product),
    )
  }
}
