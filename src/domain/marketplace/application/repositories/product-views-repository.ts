import { ProductView } from '../../enterprise/entities/product-view'

export abstract class ProductViewsRepository {
  abstract create(productView: ProductView): Promise<void>
  abstract exists(props: {
    productId: string
    viewerId: string
  }): Promise<boolean>
}
