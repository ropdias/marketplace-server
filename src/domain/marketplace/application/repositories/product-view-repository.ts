import { ProductView } from '../../enterprise/entities/product-view'

export abstract class ProductViewRepository {
  abstract create(productView: ProductView): Promise<void>
}
