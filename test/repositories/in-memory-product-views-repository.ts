/* eslint-disable @typescript-eslint/require-await */
import { ProductViewsRepository } from '@/domain/marketplace/application/repositories/product-views-repository'
import { ProductView } from '@/domain/marketplace/enterprise/entities/product-view'

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

      // Normalize date
      const day = new Date(item.createdAt)
      day.setHours(0, 0, 0, 0)
      const key = day.toISOString() // unique key for the day
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    return Array.from(counts.entries())
      .map(([dateString, amount]) => ({
        date: new Date(dateString),
        amount,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }
}
