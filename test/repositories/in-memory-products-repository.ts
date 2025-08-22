/* eslint-disable @typescript-eslint/require-await */
import {
  FindManyBySellerIdParams,
  FindManyRecentParams,
  ProductsRepository,
} from '@/domain/marketplace/application/repositories/products-repository'
import { Product } from '@/domain/marketplace/enterprise/entities/product'
import { InMemoryProductAttachmentsRepository } from './in-memory-product-attachments-repository'
import {
  ProductStatus,
  ProductStatusEnum,
} from '@/domain/marketplace/enterprise/entities/value-objects/product-status'

export class InMemoryProductsRepository implements ProductsRepository {
  public items: Product[] = []

  constructor(
    private productAttachmentsRepository: InMemoryProductAttachmentsRepository,
  ) {}

  async findById(id: string): Promise<Product | null> {
    const product = this.items.find((item) => item.id.toString() === id)

    if (!product) {
      return null
    }

    return product
  }

  async findManyRecent({
    page,
    search,
    status,
  }: FindManyRecentParams): Promise<Product[]> {
    let products = this.items

    if (search) {
      products = products.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase()),
      )
    }

    if (status) {
      products = products.filter((item) => item.status.equals(status))
    }

    products = products.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )

    if (page) {
      products = products.slice((page - 1) * 20, page * 20)
    }

    return products
  }

  async findManyBySellerId({
    sellerId,
    search,
    status,
  }: FindManyBySellerIdParams): Promise<Product[]> {
    let products = this.items.filter(
      (item) => item.ownerId.toString() === sellerId,
    )

    if (search) {
      products = products.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase()),
      )
    }

    if (status) {
      products = products.filter((item) => item.status.equals(status))
    }

    return products
  }

  async save(product: Product): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id === product.id)

    this.items[itemIndex] = product

    await this.productAttachmentsRepository.createMany(
      product.attachments.getNewItems(),
    )

    await this.productAttachmentsRepository.deleteMany(
      product.attachments.getRemovedItems(),
    )
  }

  async create(product: Product): Promise<void> {
    this.items.push(product)

    await this.productAttachmentsRepository.createMany(
      product.attachments.getItems(),
    )
  }

  async countSoldSince({
    ownerId,
    since,
  }: {
    ownerId: string
    since: Date
  }): Promise<number> {
    const productStatus = ProductStatus.create(ProductStatusEnum.SOLD)

    return this.items.filter(
      (item) =>
        item.ownerId.toString() === ownerId &&
        item.status.equals(productStatus) &&
        item.soldAt !== undefined &&
        item.soldAt >= since,
    ).length
  }

  async countAvailableSince({
    ownerId,
    since,
  }: {
    ownerId: string
    since: Date
  }): Promise<number> {
    const productStatus = ProductStatus.create(ProductStatusEnum.AVAILABLE)

    return this.items.filter(
      (item) =>
        item.ownerId.toString() === ownerId &&
        item.status.equals(productStatus) &&
        item.createdAt >= since,
    ).length
  }
}
