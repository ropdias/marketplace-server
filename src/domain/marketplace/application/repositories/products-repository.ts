import { Product } from '../../enterprise/entities/product'

export abstract class ProductsRepository {
  abstract create(product: Product): Promise<void>
}
