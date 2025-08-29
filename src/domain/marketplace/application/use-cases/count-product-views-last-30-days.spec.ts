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
import { CountProductViewsLast30DaysUseCase } from './count-product-views-last-30-days'
import { InMemoryProductViewsRepository } from 'test/repositories/in-memory-product-views-repository'
import { makeProductView } from 'test/factories/make-product-view'

let inMemoryProductAttachmentsRepository: InMemoryProductAttachmentsRepository
let inMemoryProductsRepository: InMemoryProductsRepository
let inMemorySellersRepository: InMemorySellersRepository
let inMemoryCategoriesRepository: InMemoryCategoriesRepository
let inMemoryProductViewsRepository: InMemoryProductViewsRepository
let sut: CountProductViewsLast30DaysUseCase

describe('Count Product Views Last 30 Days', () => {
  beforeEach(() => {
    inMemoryProductAttachmentsRepository =
      new InMemoryProductAttachmentsRepository()
    inMemoryProductsRepository = new InMemoryProductsRepository(
      inMemoryProductAttachmentsRepository,
    )
    inMemorySellersRepository = new InMemorySellersRepository()
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository()
    inMemoryProductViewsRepository = new InMemoryProductViewsRepository()
    sut = new CountProductViewsLast30DaysUseCase(
      inMemoryProductViewsRepository,
      inMemorySellersRepository,
      inMemoryProductsRepository,
    )
  })

  it('should be able to count product views from last 30 days', async () => {
    const sellers: Seller[] = []
    for (let i = 0; i < 3; i++) {
      const seller = makeSeller()
      await inMemorySellersRepository.create(seller)
      sellers.push(seller)
    }

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const now = new Date()

    // 10 products to seller[0] (target)
    const productsFromSeller: Product[] = []
    for (let i = 0; i < 10; i++) {
      const product = makeProduct({
        ownerId: sellers[0].id,
        categoryId: category.id,
      })
      await inMemoryProductsRepository.create(product)
      productsFromSeller.push(product)
    }

    // 5 products for other sellers
    const productsFromOtherSellers: Product[] = []
    for (let i = 0; i < 5; i++) {
      const seller = sellers[1 + (i % 2)]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
      })
      await inMemoryProductsRepository.create(product)
      productsFromOtherSellers.push(product)
    }

    // Create valid views: sellers 1 and 2 viewing products from seller[0] in the last 30 days
    // Each seller views 3 distinct products
    for (let i = 1; i <= 2; i++) {
      const viewer = sellers[i]
      for (let j = 0; j < 3; j++) {
        const product = productsFromSeller[i * 3 + j - 1]
        const createdAt = new Date(now)
        createdAt.setDate(now.getDate() - (i * 3 + j)) // deterministic in the last 30 days
        createdAt.setHours(12, 0, 0, 0)

        await inMemoryProductViewsRepository.create(
          makeProductView({
            productId: product.id,
            viewerId: viewer.id,
            createdAt,
          }),
        )
      }
    }

    // Views that SHOULD NOT count:
    // - seller viewing their own product
    // - products from other sellers
    // - old views (>30 days)
    await inMemoryProductViewsRepository.create(
      makeProductView({
        productId: productsFromOtherSellers[0].id,
        viewerId: sellers[0].id, // own seller
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // within 30 days
      }),
    )
    await inMemoryProductViewsRepository.create(
      makeProductView({
        productId: productsFromSeller[0].id,
        viewerId: sellers[1].id,
        createdAt: new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000), // older than 30 days
      }),
    )

    const result = await sut.execute({ sellerId: sellers[0].id.toString() })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      // 2 sellers × 3 views each = 6 valid views
      expect(result.value.amount).toBe(6)
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
