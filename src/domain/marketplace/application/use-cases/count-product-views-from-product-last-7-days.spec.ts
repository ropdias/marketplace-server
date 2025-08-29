import { makeSeller } from 'test/factories/make-seller'
import { InMemorySellersRepository } from 'test/repositories/in-memory-sellers-repository'
import { InMemoryProductsRepository } from 'test/repositories/in-memory-products-repository'
import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { InMemoryProductAttachmentsRepository } from 'test/repositories/in-memory-product-attachments-repository'
import { makeCategory } from 'test/factories/make-category'
import { makeProduct } from 'test/factories/make-product'
import { Seller } from '../../enterprise/entities/seller'
import { Product } from '../../enterprise/entities/product'
import { InMemoryProductViewsRepository } from 'test/repositories/in-memory-product-views-repository'
import { makeProductView } from 'test/factories/make-product-view'
import { dayjs } from '@/core/libs/dayjs'
import { CountProductViewsFromProductLast7DaysUseCase } from './count-product-views-from-product-last-7-days'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

let inMemoryProductAttachmentsRepository: InMemoryProductAttachmentsRepository
let inMemoryProductsRepository: InMemoryProductsRepository
let inMemorySellersRepository: InMemorySellersRepository
let inMemoryCategoriesRepository: InMemoryCategoriesRepository
let inMemoryProductViewsRepository: InMemoryProductViewsRepository
let sut: CountProductViewsFromProductLast7DaysUseCase

describe('Count Product Views from Product Last 7 Days', () => {
  beforeEach(() => {
    inMemoryProductAttachmentsRepository =
      new InMemoryProductAttachmentsRepository()
    inMemoryProductsRepository = new InMemoryProductsRepository(
      inMemoryProductAttachmentsRepository,
    )
    inMemorySellersRepository = new InMemorySellersRepository()
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository()
    inMemoryProductViewsRepository = new InMemoryProductViewsRepository()
    sut = new CountProductViewsFromProductLast7DaysUseCase(
      inMemoryProductViewsRepository,
      inMemorySellersRepository,
      inMemoryProductsRepository,
    )
  })

  it('should be able to count product views from product from last 7 days', async () => {
    const sellers: Seller[] = []
    for (let i = 0; i < 5; i++) {
      const seller = makeSeller()
      await inMemorySellersRepository.create(seller)
      sellers.push(seller)
    }

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const now = dayjs().utc().startOf('day').toDate()

    // 5 products to seller[0] (target)
    const productsFromSeller: Product[] = []
    for (let i = 0; i < 5; i++) {
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

    // Create valid views: sellers viewing productsFromSeller[0] from seller[0] in the last 7 days
    await inMemoryProductViewsRepository.create(
      makeProductView({
        productId: productsFromSeller[0].id,
        viewerId: sellers[1].id,
        createdAt: dayjs.utc(now).subtract(7, 'day').toDate(),
      }),
    )
    await inMemoryProductViewsRepository.create(
      makeProductView({
        productId: productsFromSeller[0].id,
        viewerId: sellers[2].id,
        createdAt: dayjs.utc(now).subtract(0, 'day').toDate(),
      }),
    )
    await inMemoryProductViewsRepository.create(
      makeProductView({
        productId: productsFromSeller[0].id,
        viewerId: sellers[3].id,
        createdAt: dayjs.utc(now).subtract(4, 'day').toDate(),
      }),
    )

    // Views that SHOULD NOT count:
    // - sellers[0] viewing products from other sellers within 7 days
    // - old views (>7 days)
    await inMemoryProductViewsRepository.create(
      makeProductView({
        productId: productsFromOtherSellers[0].id,
        viewerId: sellers[0].id, // own seller
        createdAt: dayjs.utc(now).subtract(5, 'day').toDate(), // within 7 days
      }),
    )
    await inMemoryProductViewsRepository.create(
      makeProductView({
        productId: productsFromSeller[0].id,
        viewerId: sellers[4].id,
        createdAt: dayjs.utc(now).subtract(8, 'day').toDate(), // older than 7 days
      }),
    )

    const result = await sut.execute({
      sellerId: sellers[0].id.toString(),
      productId: productsFromSeller[0].id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      // 3 sellers × 1 views each = 3 valid views
      expect(result.value.amount).toBe(3)
    }
  })

  it('should return ResourceNotFoundError if seller does not exist', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)
    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)
    const product = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    await inMemoryProductsRepository.create(product)

    const result = await sut.execute({
      sellerId: 'non-existent-seller-id',
      productId: product.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return ResourceNotFoundError if product does not exist', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const result = await sut.execute({
      sellerId: seller.id.toString(),
      productId: 'non-existent-product-id',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })
})
