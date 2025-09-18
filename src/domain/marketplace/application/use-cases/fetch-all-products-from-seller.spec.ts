import { makeSeller } from 'test/factories/make-seller'
import { InMemorySellersRepository } from 'test/repositories/in-memory-sellers-repository'
import { SellerProfileFactory } from '../factories/seller-profile-factory'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { InMemoryProductsRepository } from 'test/repositories/in-memory-products-repository'
import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { InMemoryProductAttachmentsRepository } from 'test/repositories/in-memory-product-attachments-repository'
import { ProductDetailsFactory } from '../factories/product-details-factory'
import { ProductDetailsMapper } from '../mappers/product-details-mapper'
import { makeProduct } from 'test/factories/make-product'
import { makeCategory } from 'test/factories/make-category'
import { FetchAllProductsFromSellerUseCase } from './fetch-all-products-from-seller'
import {
  ProductStatus,
  ProductStatusEnum,
} from '../../enterprise/entities/value-objects/product-status'
import { InvalidProductStatusError } from './errors/invalid-product-status-error'
import { Seller } from '../../enterprise/entities/seller'
import { Product } from '../../enterprise/entities/product'

let inMemoryProductAttachmentsRepository: InMemoryProductAttachmentsRepository
let inMemoryProductsRepository: InMemoryProductsRepository
let inMemorySellersRepository: InMemorySellersRepository
let inMemoryCategoriesRepository: InMemoryCategoriesRepository
let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let sut: FetchAllProductsFromSellerUseCase

describe('Fetch All Products From Seller', () => {
  beforeEach(() => {
    inMemoryProductAttachmentsRepository =
      new InMemoryProductAttachmentsRepository()
    inMemorySellersRepository = new InMemorySellersRepository()
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository()
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    inMemoryProductsRepository = new InMemoryProductsRepository(
      inMemoryProductAttachmentsRepository,
      inMemoryCategoriesRepository,
      inMemorySellersRepository,
      inMemoryAttachmentsRepository,
    )
    sut = new FetchAllProductsFromSellerUseCase(
      inMemoryProductsRepository,
      inMemorySellersRepository,
    )
  })

  it('should be able to fetch all products from seller', async () => {
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

    // Create expectedProducts
    for (let i = 0; i < 5; i++) {
      const product = makeProduct({
        ownerId: sellers[0].id,
        categoryId: category.id,
      })
      await inMemoryProductsRepository.create(product)
      expectedProducts.push(product)
    }

    // Create otherProducts
    for (let i = 0; i < 5; i++) {
      const seller = sellers[1 + (i % (sellers.length - 1))]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }

    const result = await sut.execute({ sellerId: sellers[0].id.toString() })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const expected = expectedProducts.map((p) => {
        const owner = sellers.find((s) => s.id.equals(p.ownerId))!
        const sellerProfile = SellerProfileFactory.create({
          seller: owner,
          avatar: null,
        })
        const productDetails = ProductDetailsFactory.create({
          product: p,
          ownerProfile: sellerProfile,
          category,
          attachments: [],
        })

        return ProductDetailsMapper.toDTO(productDetails)
      })
      expect(result.value.productDetailsList).toMatchObject(expected)
      expect(result.value.productDetailsList).toHaveLength(
        expectedProducts.length,
      )
      expect(inMemoryProductsRepository.items).toHaveLength(
        expectedProducts.length + otherProducts.length,
      )
    }
  })

  it('should be able to fetch all products from seller with status equal sold', async () => {
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

    // Create expectedProducts
    for (let i = 0; i < 5; i++) {
      const product = makeProduct({
        ownerId: sellers[0].id,
        categoryId: category.id,
        status: ProductStatus.create(ProductStatusEnum.SOLD),
      })
      await inMemoryProductsRepository.create(product)
      expectedProducts.push(product)
    }

    // Create otherProducts
    for (let i = 0; i < 5; i++) {
      const product = makeProduct({
        ownerId: sellers[0].id,
        categoryId: category.id,
        status: ProductStatus.create(ProductStatusEnum.AVAILABLE),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }
    for (let i = 0; i < 5; i++) {
      const seller = sellers[1 + (i % (sellers.length - 1))]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        status: ProductStatus.create(ProductStatusEnum.AVAILABLE),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }

    const result = await sut.execute({
      sellerId: sellers[0].id.toString(),
      status: 'sold',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const expected = expectedProducts.map((p) => {
        const owner = sellers.find((s) => s.id.equals(p.ownerId))!
        const sellerProfile = SellerProfileFactory.create({
          seller: owner,
          avatar: null,
        })
        const productDetails = ProductDetailsFactory.create({
          product: p,
          ownerProfile: sellerProfile,
          category,
          attachments: [],
        })

        return ProductDetailsMapper.toDTO(productDetails)
      })
      expect(result.value.productDetailsList).toMatchObject(expected)
      expect(result.value.productDetailsList).toHaveLength(
        expectedProducts.length,
      )
      expect(inMemoryProductsRepository.items).toHaveLength(
        expectedProducts.length + otherProducts.length,
      )
    }
  })

  it('should be able to fetch all products from seller with search query equal book', async () => {
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

    // Create expectedProducts
    for (let i = 0; i < 5; i++) {
      const product = makeProduct({
        ownerId: sellers[0].id,
        categoryId: category.id,
        title: 'Book ' + (i + 1),
      })
      await inMemoryProductsRepository.create(product)
      expectedProducts.push(product)
    }

    // Create otherProducts
    for (let i = 0; i < 5; i++) {
      const product = makeProduct({
        ownerId: sellers[0].id,
        categoryId: category.id,
        title: 'Phone ' + (i + 1),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }
    for (let i = 0; i < 5; i++) {
      const seller = sellers[1 + (i % (sellers.length - 1))]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        title: 'Phone ' + (i + 1),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }

    const result = await sut.execute({
      sellerId: sellers[0].id.toString(),
      search: 'book',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const expected = expectedProducts.map((p) => {
        const owner = sellers.find((s) => s.id.equals(p.ownerId))!
        const sellerProfile = SellerProfileFactory.create({
          seller: owner,
          avatar: null,
        })
        const productDetails = ProductDetailsFactory.create({
          product: p,
          ownerProfile: sellerProfile,
          category,
          attachments: [],
        })

        return ProductDetailsMapper.toDTO(productDetails)
      })
      expect(result.value.productDetailsList).toMatchObject(expected)
      expect(result.value.productDetailsList).toHaveLength(
        expectedProducts.length,
      )
      expect(inMemoryProductsRepository.items).toHaveLength(
        expectedProducts.length + otherProducts.length,
      )
    }
  })

  it('should be able to fetch all products from seller with with status equal sold and search query equal book', async () => {
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

    // Create expectedProducts
    for (let i = 0; i < 5; i++) {
      const product = makeProduct({
        ownerId: sellers[0].id,
        categoryId: category.id,
        title: 'Book ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.SOLD),
      })
      await inMemoryProductsRepository.create(product)
      expectedProducts.push(product)
    }

    // Create otherProducts
    for (let i = 0; i < 5; i++) {
      const product = makeProduct({
        ownerId: sellers[0].id,
        categoryId: category.id,
        title: 'Phone ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.SOLD),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }
    for (let i = 0; i < 5; i++) {
      const product = makeProduct({
        ownerId: sellers[0].id,
        categoryId: category.id,
        title: 'Book ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.AVAILABLE),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }
    for (let i = 0; i < 5; i++) {
      const seller = sellers[1 + (i % (sellers.length - 1))]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        title: 'Phone ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.SOLD),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }
    for (let i = 0; i < 5; i++) {
      const seller = sellers[1 + (i % (sellers.length - 1))]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        title: 'Book ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.SOLD),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }

    const result = await sut.execute({
      sellerId: sellers[0].id.toString(),
      search: 'book',
      status: 'sold',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const expected = expectedProducts.map((p) => {
        const owner = sellers.find((s) => s.id.equals(p.ownerId))!
        const sellerProfile = SellerProfileFactory.create({
          seller: owner,
          avatar: null,
        })
        const productDetails = ProductDetailsFactory.create({
          product: p,
          ownerProfile: sellerProfile,
          category,
          attachments: [],
        })

        return ProductDetailsMapper.toDTO(productDetails)
      })
      expect(result.value.productDetailsList).toMatchObject(expected)
      expect(result.value.productDetailsList).toHaveLength(
        expectedProducts.length,
      )
      expect(inMemoryProductsRepository.items).toHaveLength(
        expectedProducts.length + otherProducts.length,
      )
    }
  })

  it('should return empty list if no product matches status filter', async () => {
    const sellers: Seller[] = []
    for (let i = 0; i < 10; i++) {
      const seller = makeSeller()
      await inMemorySellersRepository.create(seller)
      sellers.push(seller)
    }

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const otherProducts: Product[] = []

    // Create otherProducts
    for (let i = 0; i < 5; i++) {
      const product = makeProduct({
        ownerId: sellers[0].id,
        categoryId: category.id,
        title: 'Phone ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.SOLD),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }
    for (let i = 0; i < 5; i++) {
      const product = makeProduct({
        ownerId: sellers[0].id,
        categoryId: category.id,
        title: 'Book ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.AVAILABLE),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }
    for (let i = 0; i < 5; i++) {
      const seller = sellers[1 + (i % (sellers.length - 1))]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        title: 'Phone ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.SOLD),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }
    for (let i = 0; i < 5; i++) {
      const seller = sellers[1 + (i % (sellers.length - 1))]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        title: 'Book ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.SOLD),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }

    const result = await sut.execute({
      sellerId: sellers[0].id.toString(),
      status: 'cancelled',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.productDetailsList).toStrictEqual([])
    }
  })

  it('should return empty list if no product matches search filter', async () => {
    const sellers: Seller[] = []
    for (let i = 0; i < 10; i++) {
      const seller = makeSeller()
      await inMemorySellersRepository.create(seller)
      sellers.push(seller)
    }

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const otherProducts: Product[] = []

    // Create otherProducts
    for (let i = 0; i < 5; i++) {
      const product = makeProduct({
        ownerId: sellers[0].id,
        categoryId: category.id,
        title: 'Phone ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.SOLD),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }
    for (let i = 0; i < 5; i++) {
      const product = makeProduct({
        ownerId: sellers[0].id,
        categoryId: category.id,
        title: 'Book ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.AVAILABLE),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }
    for (let i = 0; i < 5; i++) {
      const seller = sellers[1 + (i % (sellers.length - 1))]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        title: 'Phone ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.SOLD),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }
    for (let i = 0; i < 5; i++) {
      const seller = sellers[1 + (i % (sellers.length - 1))]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        title: 'Book ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.SOLD),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }

    const result = await sut.execute({
      sellerId: sellers[0].id.toString(),
      search: 'tv',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.productDetailsList).toStrictEqual([])
    }
  })

  it('should return ResourceNotFoundError if seller does not exist', async () => {
    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product = makeProduct({
      ownerId: UniqueEntityID.create({ value: 'non-existent-owner-id' }),
      categoryId: category.id,
    })
    await inMemoryProductsRepository.create(product)

    const result = await sut.execute({ sellerId: 'non-existent-owner-id' })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return InvalidProductStatusError if status is not valid', async () => {
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
      sellerId: seller.id.toString(),
      status: 'invalid-status',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidProductStatusError)
    }
  })

  it('should return empty list if no product is found', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const result = await sut.execute({ sellerId: seller.id.toString() })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.productDetailsList).toHaveLength(0)
    }
  })
})
