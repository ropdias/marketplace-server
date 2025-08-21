import { Product } from '../../enterprise/entities/product'

export abstract class ProductsRepository {
  abstract findById(id: string): Promise<Product | null>
  abstract save(product: Product): Promise<void>
  abstract create(product: Product): Promise<void>
}
