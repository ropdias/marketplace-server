import { Product } from '../../enterprise/entities/product'
import { ProductDetails } from '../../enterprise/entities/value-objects/product-details'
import { ProductStatus } from '../../enterprise/entities/value-objects/product-status'

export interface FindManyRecentProductDetailsParams {
  page?: number
  search?: string
  status?: ProductStatus
}

export interface FindManyProductDetailsBySellerIdParams {
  sellerId: string
  search?: string
  status?: ProductStatus
}

export abstract class ProductsRepository {
  abstract findById(id: string): Promise<Product | null>
  abstract findManyBySellerId(id: string): Promise<Product[]>
  abstract save(product: Product): Promise<void>
  abstract create(product: Product): Promise<void>
  abstract countSoldSince(params: {
    ownerId: string
    since: Date
  }): Promise<number>
  abstract countAvailableSince(params: {
    ownerId: string
    since: Date
  }): Promise<number>
  abstract findProductDetailsById(id: string): Promise<ProductDetails | null>
  abstract findManyRecentProductDetailsByIds(
    params: FindManyRecentProductDetailsParams,
  ): Promise<ProductDetails[]>
  abstract findManyProductDetailsBySellerId(
    params: FindManyProductDetailsBySellerIdParams,
  ): Promise<ProductDetails[]>
}
