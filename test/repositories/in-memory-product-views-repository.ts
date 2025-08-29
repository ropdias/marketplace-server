/* eslint-disable @typescript-eslint/require-await */
import { ProductViewsRepository } from '@/domain/marketplace/application/repositories/product-views-repository'
import { ProductView } from '@/domain/marketplace/enterprise/entities/product-view'
import { dayjs } from '@/core/libs/dayjs'

export class InMemoryProductViewsRepository implements ProductViewsRepository {
  public items: ProductView[] = []

  async create(productView: ProductView): Promise<void> {
    this.items.push(productView)
  }

  async exists(props: {
    productId: string
    viewerId: string
  }): Promise<boolean> {
    const productView = this.items.find(
      (item) =>
        item.productId.toString() === props.productId &&
        item.viewerId.toString() === props.viewerId,
    )
    return !!productView
  }

  async countViewsFromProductSince({
    productId,
    since,
  }: {
    productId: string
    since: Date
  }): Promise<number> {
    return this.items.filter(
      (item) =>
        item.productId.toString() === productId && item.createdAt >= since,
    ).length
  }

  async countViewsFromProductsSince({
    productIds,
    since,
  }: {
    productIds: string[]
    since: Date
  }): Promise<number> {
    return this.items.filter(
      (item) =>
        productIds.includes(item.productId.toString()) &&
        item.createdAt >= since,
    ).length
  }

  async countViewsPerDaySince({
    productIds,
    since,
  }: {
    productIds: string[]
    since: Date
  }): Promise<{ date: Date; amount: number }[]> {
    const counts = new Map<string, number>()

    for (const item of this.items) {
      if (!productIds.includes(item.productId.toString())) continue
      if (item.createdAt < since) continue

      const day = dayjs(item.createdAt).utc().startOf('day')
      const key = day.valueOf().toString()
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    return Array.from(counts.entries())
      .map(([timestamp, amount]) => ({
        date: dayjs(Number(timestamp)).toDate(),
        amount,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }
}
