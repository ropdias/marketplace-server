import { InMemorySellersRepository } from 'test/repositories/in-memory-sellers-repository'
import { SellerProfileFactory } from '../factories/seller-profile-factory'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'
import { SellerProfileMapper } from '../mappers/seller-profile-mapper'
import { AttachmentMapper } from '../mappers/attachment-mapper'
import { InMemoryProductsRepository } from 'test/repositories/in-memory-products-repository'
import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { InMemoryProductAttachmentsRepository } from 'test/repositories/in-memory-product-attachments-repository'
import { ProductDetailsFactory } from '../factories/product-details-factory'
import { ProductDetailsMapper } from '../mappers/product-details-mapper'
import { CategoryMapper } from '../mappers/category-mapper'
import { FetchRecentProductsUseCase } from './fetch-recent-products'
import { SellerProfileAssembler } from '../assemblers/seller-profile-assembler'
import { ProductDetailsAssembler } from '../assemblers/product-details-assembler'
import { Seller } from '../../enterprise/entities/seller'
import { makeSeller } from 'test/factories/make-seller'
import { makeCategory } from 'test/factories/make-category'
import { Product } from '../../enterprise/entities/product'
import { makeProduct } from 'test/factories/make-product'
import {
  ProductStatus,
  ProductStatusEnum,
} from '../../enterprise/entities/value-objects/product-status'
import { InvalidProductStatusError } from './errors/invalid-product-status-error'

let inMemoryProductAttachmentsRepository: InMemoryProductAttachmentsRepository
let inMemoryProductsRepository: InMemoryProductsRepository
let inMemorySellersRepository: InMemorySellersRepository
let inMemoryCategoriesRepository: InMemoryCategoriesRepository
let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let sellerProfileFactory: SellerProfileFactory
let productDetailsFactory: ProductDetailsFactory
let sellerProfileAssembler: SellerProfileAssembler
let productDetailsAssembler: ProductDetailsAssembler
let attachmentMapper: AttachmentMapper
let sellerProfileMapper: SellerProfileMapper
let categoryMapper: CategoryMapper
let productDetailsMapper: ProductDetailsMapper
let sut: FetchRecentProductsUseCase

describe('Fetch Recent Products', () => {
  beforeEach(() => {
    inMemoryProductAttachmentsRepository =
      new InMemoryProductAttachmentsRepository()
    inMemoryProductsRepository = new InMemoryProductsRepository(
      inMemoryProductAttachmentsRepository,
    )
    inMemorySellersRepository = new InMemorySellersRepository()
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository()
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    sellerProfileFactory = new SellerProfileFactory()
    productDetailsFactory = new ProductDetailsFactory()
    attachmentMapper = new AttachmentMapper()
    sellerProfileMapper = new SellerProfileMapper(attachmentMapper)
    categoryMapper = new CategoryMapper()
    productDetailsMapper = new ProductDetailsMapper(
      sellerProfileMapper,
      categoryMapper,
      attachmentMapper,
    )
    sellerProfileAssembler = new SellerProfileAssembler(
      inMemoryAttachmentsRepository,
      sellerProfileFactory,
    )
    productDetailsAssembler = new ProductDetailsAssembler(
      inMemorySellersRepository,
      inMemoryCategoriesRepository,
      inMemoryAttachmentsRepository,
      sellerProfileAssembler,
      productDetailsFactory,
    )
    sut = new FetchRecentProductsUseCase(
      inMemoryProductsRepository,
      productDetailsAssembler,
      productDetailsMapper,
    )
  })

  it('should be able to fetch recent products', async () => {
    const sellers: Seller[] = []
    for (let i = 0; i < 10; i++) {
      const seller = makeSeller()
      await inMemorySellersRepository.create(seller)
      sellers.push(seller)
    }

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const products: Product[] = []
    for (let i = 0; i < 5; i++) {
      const randomSeller = sellers[i % sellers.length]
      const product = makeProduct({
        ownerId: randomSeller.id,
        categoryId: category.id,
        createdAt: new Date(2022, 0, 20 + i),
      })
      await inMemoryProductsRepository.create(product)
      products.push(product)
    }

    const result = await sut.execute({})

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const expected = products
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((p) => {
          const owner = sellers.find((s) => s.id.equals(p.ownerId))!
          const sellerProfile = sellerProfileFactory.create({
            seller: owner,
            avatar: null,
          })
          const productDetails = productDetailsFactory.create({
            product: p,
            ownerProfile: sellerProfile,
            category,
            attachments: [],
          })

          return productDetailsMapper.toDTO(productDetails)
        })

      expect(result.value.productDetailsList).toMatchObject(expected)
      expect(result.value.productDetailsList).toHaveLength(products.length)
    }
  })

  it('should be able to fetch all recent products with status equal sold', async () => {
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
      const seller = sellers[i % sellers.length]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        status: ProductStatus.create(ProductStatusEnum.SOLD),
        createdAt: new Date(2022, 0, 20 + i),
      })
      await inMemoryProductsRepository.create(product)
      expectedProducts.push(product)
    }

    // Create otherProducts
    for (let i = 0; i < 5; i++) {
      const seller = sellers[i % sellers.length]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        status: ProductStatus.create(ProductStatusEnum.AVAILABLE),
        createdAt: new Date(2022, 1, 1 + i),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }

    const result = await sut.execute({ status: 'sold' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const expected = expectedProducts
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((p) => {
          const owner = sellers.find((s) => s.id.equals(p.ownerId))!
          const sellerProfile = sellerProfileFactory.create({
            seller: owner,
            avatar: null,
          })
          const productDetails = productDetailsFactory.create({
            product: p,
            ownerProfile: sellerProfile,
            category,
            attachments: [],
          })

          return productDetailsMapper.toDTO(productDetails)
        })

      expect(result.value.productDetailsList).toMatchObject(expected)
      expect(result.value.productDetailsList).toHaveLength(
        expectedProducts.length,
      )
    }
  })

  it('should be able to fetch all recent products with search query equal book', async () => {
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
      const seller = sellers[i % sellers.length]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        title: 'Book ' + (i + 1),
        createdAt: new Date(2022, 0, 20 + i),
      })
      await inMemoryProductsRepository.create(product)
      expectedProducts.push(product)
    }

    // Create otherProducts
    for (let i = 0; i < 5; i++) {
      const seller = sellers[i % sellers.length]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        title: 'Phone ' + (i + 1),
        createdAt: new Date(2022, 1, 1 + i),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }

    const result = await sut.execute({ search: 'book' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const expected = expectedProducts
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((p) => {
          const owner = sellers.find((s) => s.id.equals(p.ownerId))!
          const sellerProfile = sellerProfileFactory.create({
            seller: owner,
            avatar: null,
          })
          const productDetails = productDetailsFactory.create({
            product: p,
            ownerProfile: sellerProfile,
            category,
            attachments: [],
          })

          return productDetailsMapper.toDTO(productDetails)
        })

      expect(result.value.productDetailsList).toMatchObject(expected)
      expect(result.value.productDetailsList).toHaveLength(
        expectedProducts.length,
      )
    }
  })

  it('should be able to fetch all recent products with with status equal sold and search query equal book', async () => {
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
      const seller = sellers[i % sellers.length]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        title: 'Book ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.SOLD),
        createdAt: new Date(2022, 0, 20 + i),
      })
      await inMemoryProductsRepository.create(product)
      expectedProducts.push(product)
    }

    // Create otherProducts
    for (let i = 0; i < 5; i++) {
      const seller = sellers[i % sellers.length]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        title: 'Book ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.AVAILABLE),
        createdAt: new Date(2022, 0, 20 + i),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }
    for (let i = 0; i < 5; i++) {
      const seller = sellers[i % sellers.length]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        title: 'Phone ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.SOLD),
        createdAt: new Date(2022, 1, 1 + i),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }
    for (let i = 0; i < 5; i++) {
      const seller = sellers[i % sellers.length]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        title: 'TV ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.AVAILABLE),
        createdAt: new Date(2022, 1, 1 + i),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }

    const result = await sut.execute({ search: 'book', status: 'sold' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const expected = expectedProducts
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((p) => {
          const owner = sellers.find((s) => s.id.equals(p.ownerId))!
          const sellerProfile = sellerProfileFactory.create({
            seller: owner,
            avatar: null,
          })
          const productDetails = productDetailsFactory.create({
            product: p,
            ownerProfile: sellerProfile,
            category,
            attachments: [],
          })

          return productDetailsMapper.toDTO(productDetails)
        })

      expect(result.value.productDetailsList).toMatchObject(expected)
      expect(result.value.productDetailsList).toHaveLength(
        expectedProducts.length,
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

    const expectedProducts: Product[] = []
    const otherProducts: Product[] = []

    // Create otherProducts
    for (let i = 0; i < 5; i++) {
      const seller = sellers[i % sellers.length]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        title: 'Book ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.AVAILABLE),
        createdAt: new Date(2022, 0, 20 + i),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }
    for (let i = 0; i < 5; i++) {
      const seller = sellers[i % sellers.length]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        title: 'Phone ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.SOLD),
        createdAt: new Date(2022, 1, 1 + i),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }
    for (let i = 0; i < 5; i++) {
      const seller = sellers[i % sellers.length]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        title: 'TV ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.AVAILABLE),
        createdAt: new Date(2022, 1, 1 + i),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }

    const result = await sut.execute({ status: 'cancelled' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const expected = expectedProducts
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((p) => {
          const owner = sellers.find((s) => s.id.equals(p.ownerId))!
          const sellerProfile = sellerProfileFactory.create({
            seller: owner,
            avatar: null,
          })
          const productDetails = productDetailsFactory.create({
            product: p,
            ownerProfile: sellerProfile,
            category,
            attachments: [],
          })

          return productDetailsMapper.toDTO(productDetails)
        })

      expect(result.value.productDetailsList).toMatchObject(expected)
      expect(result.value.productDetailsList).toHaveLength(
        expectedProducts.length,
      )
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

    const expectedProducts: Product[] = []
    const otherProducts: Product[] = []

    // Create otherProducts
    for (let i = 0; i < 5; i++) {
      const seller = sellers[i % sellers.length]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        title: 'Book ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.AVAILABLE),
        createdAt: new Date(2022, 0, 20 + i),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }
    for (let i = 0; i < 5; i++) {
      const seller = sellers[i % sellers.length]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        title: 'Phone ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.SOLD),
        createdAt: new Date(2022, 1, 1 + i),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }
    for (let i = 0; i < 5; i++) {
      const seller = sellers[i % sellers.length]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        title: 'TV ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.AVAILABLE),
        createdAt: new Date(2022, 1, 1 + i),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }

    const result = await sut.execute({ search: 'table' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const expected = expectedProducts
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((p) => {
          const owner = sellers.find((s) => s.id.equals(p.ownerId))!
          const sellerProfile = sellerProfileFactory.create({
            seller: owner,
            avatar: null,
          })
          const productDetails = productDetailsFactory.create({
            product: p,
            ownerProfile: sellerProfile,
            category,
            attachments: [],
          })

          return productDetailsMapper.toDTO(productDetails)
        })

      expect(result.value.productDetailsList).toMatchObject(expected)
      expect(result.value.productDetailsList).toHaveLength(
        expectedProducts.length,
      )
    }
  })

  it('should be able to fetch all recent products from page 2', async () => {
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
      const seller = sellers[i % sellers.length]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        title: 'Book ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.SOLD),
        createdAt: new Date(2021, 0, 20 + i),
      })
      await inMemoryProductsRepository.create(product)
      expectedProducts.push(product)
    }

    // Create otherProducts
    for (let i = 0; i < 20; i++) {
      const seller = sellers[i % sellers.length]
      const product = makeProduct({
        ownerId: seller.id,
        categoryId: category.id,
        title: 'Book ' + (i + 1),
        status: ProductStatus.create(ProductStatusEnum.SOLD),
        createdAt: new Date(2022, 0, 20 + i),
      })
      await inMemoryProductsRepository.create(product)
      otherProducts.push(product)
    }

    const result = await sut.execute({
      search: 'book',
      status: 'sold',
      page: 2,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const expected = expectedProducts
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((p) => {
          const owner = sellers.find((s) => s.id.equals(p.ownerId))!
          const sellerProfile = sellerProfileFactory.create({
            seller: owner,
            avatar: null,
          })
          const productDetails = productDetailsFactory.create({
            product: p,
            ownerProfile: sellerProfile,
            category,
            attachments: [],
          })

          return productDetailsMapper.toDTO(productDetails)
        })

      expect(result.value.productDetailsList).toMatchObject(expected)
      expect(result.value.productDetailsList).toHaveLength(
        expectedProducts.length,
      )
    }
  })

  it('should return InvalidProductStatusError if status is not valid', async () => {
    const result = await sut.execute({ status: 'invalid-status' })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidProductStatusError)
    }
  })
})
