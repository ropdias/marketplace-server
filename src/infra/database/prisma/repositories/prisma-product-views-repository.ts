import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { ProductViewsRepository } from '@/domain/marketplace/application/repositories/product-views-repository'
import { ProductView } from '@/domain/marketplace/enterprise/entities/product-view'
import { PrismaProductViewMapper } from '../mappers/prisma-product-view-mapper'
import { dayjs } from '@/core/libs/dayjs'

@Injectable()
export class PrismaProductViewsRepository implements ProductViewsRepository {
  constructor(private prisma: PrismaService) {}

  async create(productView: ProductView): Promise<void> {
    const data = PrismaProductViewMapper.toPrisma(productView)
    await this.prisma.productView.create({ data })
  }

  async exists({
    productId,
    viewerId,
  }: {
    productId: string
    viewerId: string
  }): Promise<boolean> {
    const view = await this.prisma.productView.findFirst({
      where: {
        productId,
        viewerId,
      },
    })

    return !!view
  }

  async countViewsFromProductSince({
    productId,
    since,
  }: {
    productId: string
    since: Date
  }): Promise<number> {
    const count = await this.prisma.productView.count({
      where: {
        productId: productId,
        createdAt: {
          gte: since,
        },
      },
    })

    return count
  }

  async countViewsFromProductsSince({
    productIds,
    since,
  }: {
    productIds: string[]
    since: Date
  }): Promise<number> {
    const count = await this.prisma.productView.count({
      where: {
        productId: { in: productIds },
        createdAt: {
          gte: since,
        },
      },
    })

    return count
  }

  async countViewsPerDaySince({
    productIds,
    since,
  }: {
    productIds: string[]
    since: Date
  }): Promise<{ date: Date; amount: number }[]> {
    // Fetch only the timestamps of the filtered views
    const views = await this.prisma.productView.findMany({
      where: {
        productId: { in: productIds },
        createdAt: { gte: since },
      },
      select: { createdAt: true }, // We only need the date
    })

    // Group by day using UTC
    const counts = new Map<string, number>()
    for (const view of views) {
      const day = dayjs(view.createdAt).utc().startOf('day')
      const key = day.valueOf().toString()
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    // Transform to array and sort by date
    return Array.from(counts.entries())
      .map(([timestamp, amount]) => ({
        date: dayjs(Number(timestamp)).toDate(),
        amount,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }
}
