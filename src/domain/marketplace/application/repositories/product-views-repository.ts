import { ProductView } from '../../enterprise/entities/product-view'

export abstract class ProductViewsRepository {
  abstract create(productView: ProductView): Promise<void>
  abstract exists(props: {
    productId: string
    viewerId: string
  }): Promise<boolean>
  abstract countViewsFromProductSince(params: {
    productId: string
    since: Date
  }): Promise<number>
  abstract countViewsFromProductsSince(params: {
    productIds: string[]
    since: Date
  }): Promise<number>
  abstract countViewsPerDaySince(params: {
    productIds: string[]
    since: Date
  }): Promise<{ date: Date; amount: number }[]>
}
