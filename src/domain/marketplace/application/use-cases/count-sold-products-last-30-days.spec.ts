import { makeSeller } from 'test/factories/make-seller'
import { InMemorySellersRepository } from 'test/repositories/in-memory-sellers-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { InMemoryProductsRepository } from 'test/repositories/in-memory-products-repository'
import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { InMemoryProductAttachmentsRepository } from 'test/repositories/in-memory-product-attachments-repository'
import { makeCategory } from 'test/factories/make-category'
import { makeProduct } from 'test/factories/make-product'
import { Seller } from '../../enterprise/entities/seller'
import { Product } from '../../enterprise/entities/product'
import {
  ProductStatus,
  ProductStatusEnum,
} from '../../enterprise/entities/value-objects/product-status'
import { CountSoldProductsLast30DaysUseCase } from './count-sold-products-last-30-days'
import { dayjs } from '@/core/libs/dayjs'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'

let inMemoryProductAttachmentsRepository: InMemoryProductAttachmentsRepository
let inMemoryProductsRepository: InMemoryProductsRepository
let inMemorySellersRepository: InMemorySellersRepository
let inMemoryCategoriesRepository: InMemoryCategoriesRepository
let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let sut: CountSoldProductsLast30DaysUseCase

describe('Count Sold Products Last 30 Days', () => {
  beforeEach(() => {
    inMemoryProductAttachmentsRepository =
      new InMemoryProductAttachmentsRepository()
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository()
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    inMemorySellersRepository = new InMemorySellersRepository(
      inMemoryAttachmentsRepository,
    )
    inMemoryProductsRepository = new InMemoryProductsRepository(
      inMemoryProductAttachmentsRepository,
      inMemoryCategoriesRepository,
      inMemorySellersRepository,
      inMemoryAttachmentsRepository,
    )
    sut = new CountSoldProductsLast30DaysUseCase(
      inMemoryProductsRepository,
      inMemorySellersRepository,
    )
  })

  it('should be able to count sold products from last 30 days', async () => {
    const sellers: Seller[] = []
    for (let i = 0; i < 10; i++) {
      const seller = makeSeller()
      await inMemorySellersRepository.create(seller)
      sellers.push(seller)
    }

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const expectedProducts: Product[] = []
    const otherProducts: Product[] = []

    const now = dayjs().utc().startOf('day').toDate()

    // Create expectedProducts
    for (let i = 0; i < 30; i++) {
      const createdAt = dayjs.utc(now).subtract(i, 'day').toDate()
      const product = makeProduct({
        ownerId: sellers[0].id,
        categoryId: category.id,
        soldAt: createdAt,
        createdAt,
        status: ProductStatus.create(ProductStatusEnum.SOLD),
      })
      await inMemoryProductsRepository.create(product)
      expectedProducts.push(product)
    }

    // Create otherProducts
    for (let i = 31; i < 61; i++) {
      const createdAt = dayjs.utc(now).subtract(i, 'day').toDate()
      const product = makeProduct({
        ownerId: sellers[0].id,
        categoryId: category.id,
        createdAt,
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }
    for (let i = 0; i < 30; i++) {
      const createdAt = dayjs.utc(now).subtract(i, 'day').toDate()
      const seller = sellers[1 + (i % (sellers.length - 1))]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        soldAt: createdAt,
        createdAt,
        status: ProductStatus.create(ProductStatusEnum.SOLD),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }
    for (let i = 0; i < 30; i++) {
      const createdAt = dayjs.utc(now).subtract(i, 'day').toDate()
      const product = makeProduct({
        ownerId: sellers[0].id,
        categoryId: category.id,
        createdAt,
        status: ProductStatus.create(ProductStatusEnum.AVAILABLE),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }
    for (let i = 0; i < 30; i++) {
      const createdAt = dayjs.utc(now).subtract(i, 'day').toDate()
      const product = makeProduct({
        ownerId: sellers[0].id,
        categoryId: category.id,
        createdAt,
        status: ProductStatus.create(ProductStatusEnum.CANCELLED),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }

    const result = await sut.execute({ sellerId: sellers[0].id.toString() })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.amount).toBe(expectedProducts.length)
    }
  })

  it('should return ResourceNotFoundError if seller does not exist', async () => {
    const result = await sut.execute({
      sellerId: 'non-existent-seller-id',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })
})
