import { makeSeller } from 'test/factories/make-seller'
import { InMemorySellersRepository } from 'test/repositories/in-memory-sellers-repository'
import { SellerProfileFactory } from '../factories/seller-profile-factory'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { SellerProfileMapper } from '../mappers/seller-profile-mapper'
import { InMemoryProductsRepository } from 'test/repositories/in-memory-products-repository'
import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { InMemoryProductAttachmentsRepository } from 'test/repositories/in-memory-product-attachments-repository'
import { ProductDetailsFactory } from '../factories/product-details-factory'
import { ProductDetailsMapper } from '../mappers/product-details-mapper'
import { makeCategory } from 'test/factories/make-category'
import { RegisterProductViewUseCase } from './register-product-view'
import { InMemoryProductViewsRepository } from 'test/repositories/in-memory-product-views-repository'
import { makeProduct } from 'test/factories/make-product'
import { ViewerIsProductOwnerError } from './errors/viewer-is-product-owner-error'
import { makeProductView } from 'test/factories/make-product-view'
import { ProductViewAlreadyExistsError } from './errors/product-view-already-exists-error'
import { SellerProfileAssembler } from '../assemblers/seller-profile-assembler'
import { ProductDetailsAssembler } from '../assemblers/product-details-assembler'

let inMemoryProductViewsRepository: InMemoryProductViewsRepository
let inMemoryProductAttachmentsRepository: InMemoryProductAttachmentsRepository
let inMemoryProductsRepository: InMemoryProductsRepository
let inMemorySellersRepository: InMemorySellersRepository
let inMemoryCategoriesRepository: InMemoryCategoriesRepository
let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let sellerProfileAssembler: SellerProfileAssembler
let productDetailsAssembler: ProductDetailsAssembler
let sut: RegisterProductViewUseCase

describe('Register Product View', () => {
  beforeEach(() => {
    inMemoryProductViewsRepository = new InMemoryProductViewsRepository()
    inMemoryProductAttachmentsRepository =
      new InMemoryProductAttachmentsRepository()
    inMemoryProductsRepository = new InMemoryProductsRepository(
      inMemoryProductAttachmentsRepository,
    )
    inMemorySellersRepository = new InMemorySellersRepository()
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository()
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    sellerProfileAssembler = new SellerProfileAssembler(
      inMemoryAttachmentsRepository,
    )
    productDetailsAssembler = new ProductDetailsAssembler(
      inMemorySellersRepository,
      inMemoryCategoriesRepository,
      inMemoryAttachmentsRepository,
      sellerProfileAssembler,
    )
    sut = new RegisterProductViewUseCase(
      inMemoryProductViewsRepository,
      inMemoryProductsRepository,
      inMemorySellersRepository,
      sellerProfileAssembler,
      productDetailsAssembler,
    )
  })

  it('should be able to create a product view without owner avatar and attachments', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)
    const viewer = makeSeller()
    await inMemorySellersRepository.create(viewer)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    await inMemoryProductsRepository.create(product)

    const result = await sut.execute({
      productId: product.id.toString(),
      viewerId: viewer.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const sellerProfile = SellerProfileFactory.create({
        seller,
        avatar: null,
      })
      const productDetails = ProductDetailsFactory.create({
        product,
        ownerProfile: sellerProfile,
        category,
        attachments: [],
      })
      const productDetailsDTO = ProductDetailsMapper.toDTO(productDetails)
      expect(result.value.productDetails).toMatchObject(productDetailsDTO)

      const viewerProfile = SellerProfileFactory.create({
        seller: viewer,
        avatar: null,
      })
      const viewerProfileDTO = SellerProfileMapper.toDTO(viewerProfile)
      expect(result.value.viewerProfile).toMatchObject(viewerProfileDTO)

      expect(inMemoryProductViewsRepository.items).toHaveLength(1)
      expect(
        inMemoryProductViewsRepository.items[0].productId.equals(product.id),
      ).toBe(true)
      expect(
        inMemoryProductViewsRepository.items[0].viewerId.equals(viewer.id),
      ).toBe(true)
    }
  })

  it('should be able to create multiple different product views of a single product', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)
    const viewer1 = makeSeller()
    await inMemorySellersRepository.create(viewer1)
    const viewer2 = makeSeller()
    await inMemorySellersRepository.create(viewer2)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    await inMemoryProductsRepository.create(product)

    const result1 = await sut.execute({
      productId: product.id.toString(),
      viewerId: viewer1.id.toString(),
    })

    expect(result1.isRight()).toBe(true)
    if (result1.isRight()) {
      const sellerProfile = SellerProfileFactory.create({
        seller,
        avatar: null,
      })
      const productDetails = ProductDetailsFactory.create({
        product,
        ownerProfile: sellerProfile,
        category,
        attachments: [],
      })
      const productDetailsDTO = ProductDetailsMapper.toDTO(productDetails)
      expect(result1.value.productDetails).toMatchObject(productDetailsDTO)

      const viewerProfile1 = SellerProfileFactory.create({
        seller: viewer1,
        avatar: null,
      })
      const viewerProfileDTO1 = SellerProfileMapper.toDTO(viewerProfile1)
      expect(result1.value.viewerProfile).toMatchObject(viewerProfileDTO1)

      expect(inMemoryProductViewsRepository.items).toHaveLength(1)
      expect(
        inMemoryProductViewsRepository.items[0].productId.equals(product.id),
      ).toBe(true)
      expect(
        inMemoryProductViewsRepository.items[0].viewerId.equals(viewer1.id),
      ).toBe(true)
    }

    const result2 = await sut.execute({
      productId: product.id.toString(),
      viewerId: viewer2.id.toString(),
    })

    expect(result2.isRight()).toBe(true)
    if (result2.isRight()) {
      const sellerProfile = SellerProfileFactory.create({
        seller,
        avatar: null,
      })
      const productDetails = ProductDetailsFactory.create({
        product,
        ownerProfile: sellerProfile,
        category,
        attachments: [],
      })
      const productDetailsDTO = ProductDetailsMapper.toDTO(productDetails)
      expect(result2.value.productDetails).toMatchObject(productDetailsDTO)

      const viewerProfile2 = SellerProfileFactory.create({
        seller: viewer2,
        avatar: null,
      })
      const viewerProfileDTO2 = SellerProfileMapper.toDTO(viewerProfile2)
      expect(result2.value.viewerProfile).toMatchObject(viewerProfileDTO2)

      expect(inMemoryProductViewsRepository.items).toHaveLength(2)
      expect(
        inMemoryProductViewsRepository.items[0].productId.equals(product.id),
      ).toBe(true)
      expect(
        inMemoryProductViewsRepository.items[0].viewerId.equals(viewer1.id),
      ).toBe(true)
      expect(
        inMemoryProductViewsRepository.items[1].productId.equals(product.id),
      ).toBe(true)
      expect(
        inMemoryProductViewsRepository.items[1].viewerId.equals(viewer2.id),
      ).toBe(true)
    }
  })

  it('should return ResourceNotFoundError if viewer does not exist', async () => {
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
      productId: product.id.toString(),
      viewerId: 'non-existent-viewer-id',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return ResourceNotFoundError if product does not exist', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)
    const viewer = makeSeller()
    await inMemorySellersRepository.create(viewer)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const result = await sut.execute({
      productId: 'non-existent-product-id',
      viewerId: viewer.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return ViewerIsProductOwnerError if product owner is the same as viewer', async () => {
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
      productId: product.id.toString(),
      viewerId: seller.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ViewerIsProductOwnerError)
    }
  })

  it('should return ProductViewAlreadyExistsError if product view is already registered', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)
    const viewer = makeSeller()
    await inMemorySellersRepository.create(viewer)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    await inMemoryProductsRepository.create(product)

    const productView = makeProductView({
      productId: product.id,
      viewerId: viewer.id,
    })
    await inMemoryProductViewsRepository.create(productView)

    const result = await sut.execute({
      productId: product.id.toString(),
      viewerId: viewer.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProductViewAlreadyExistsError)
    }
  })

  it('should be able to create a product view and the next time it should return ProductViewAlreadyExistsError', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)
    const viewer = makeSeller()
    await inMemorySellersRepository.create(viewer)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    await inMemoryProductsRepository.create(product)

    const result1 = await sut.execute({
      productId: product.id.toString(),
      viewerId: viewer.id.toString(),
    })

    expect(result1.isRight()).toBe(true)
    if (result1.isRight()) {
      const sellerProfile = SellerProfileFactory.create({
        seller,
        avatar: null,
      })
      const productDetails = ProductDetailsFactory.create({
        product,
        ownerProfile: sellerProfile,
        category,
        attachments: [],
      })
      const productDetailsDTO = ProductDetailsMapper.toDTO(productDetails)
      expect(result1.value.productDetails).toMatchObject(productDetailsDTO)

      const viewerProfile = SellerProfileFactory.create({
        seller: viewer,
        avatar: null,
      })
      const viewerProfileDTO = SellerProfileMapper.toDTO(viewerProfile)
      expect(result1.value.viewerProfile).toMatchObject(viewerProfileDTO)

      expect(inMemoryProductViewsRepository.items).toHaveLength(1)
      expect(
        inMemoryProductViewsRepository.items[0].productId.equals(product.id),
      ).toBe(true)
      expect(
        inMemoryProductViewsRepository.items[0].viewerId.equals(viewer.id),
      ).toBe(true)
    }

    const result2 = await sut.execute({
      productId: product.id.toString(),
      viewerId: viewer.id.toString(),
    })

    expect(result2.isLeft()).toBe(true)
    if (result2.isLeft()) {
      expect(result2.value).toBeInstanceOf(ProductViewAlreadyExistsError)
    }
  })
})
