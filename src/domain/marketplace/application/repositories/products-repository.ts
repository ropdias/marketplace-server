import { Product } from '../../enterprise/entities/product'
import { ProductStatus } from '../../enterprise/entities/value-objects/product-status'

export interface FindManyRecentParams {
  page?: number
  search?: string
  status?: ProductStatus
}

export interface FindManyBySellerIdParams {
  sellerId: string
  search?: string
  status?: ProductStatus
}

export abstract class ProductsRepository {
  abstract findById(id: string): Promise<Product | null>
  abstract findManyRecent(params: FindManyRecentParams): Promise<Product[]>
  abstract findManyBySellerId(
    params: FindManyBySellerIdParams,
  ): Promise<Product[]>
  abstract save(product: Product): Promise<void>
  abstract create(product: Product): Promise<void>
}
