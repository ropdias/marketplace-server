import { makeSeller } from 'test/factories/make-seller'
import { InMemorySellersRepository } from 'test/repositories/in-memory-sellers-repository'
import { SellerProfileFactory } from '../factories/seller-profile-factory'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'
import { makeAttachment } from 'test/factories/make-attachment'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { SellerProfileMapper } from '../mappers/seller-profile-mapper'
import { AttachmentMapper } from '../mappers/attachment-mapper'
import { InMemoryProductsRepository } from 'test/repositories/in-memory-products-repository'
import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { InMemoryProductAttachmentsRepository } from 'test/repositories/in-memory-product-attachments-repository'
import { ProductDetailsFactory } from '../factories/product-details-factory'
import { ProductDetailsMapper } from '../mappers/product-details-mapper'
import { CategoryMapper } from '../mappers/category-mapper'
import { makeProduct } from 'test/factories/make-product'
import { makeCategory } from 'test/factories/make-category'
import { ProductAttachmentList } from '../../enterprise/entities/product-attachment-list'
import { ProductAttachment } from '../../enterprise/entities/product-attachment'
import { NotProductOwnerError } from './errors/not-product-owner-error'
import {
  ProductStatus,
  ProductStatusEnum,
} from '../../enterprise/entities/value-objects/product-status'
import { ChangeProductStatusUseCase } from './change-product-status'
import { InvalidProductStatusError } from './errors/invalid-product-status-error'
import { ProductWithSameStatusError } from './errors/product-with-same-status-error'
import { ProductHasAlreadyBeenSoldError } from './errors/product-has-already-been-sold-error'
import { ProductHasAlreadyBeenCancelledError } from './errors/product-has-already-been-cancelled-error'

let inMemoryProductAttachmentsRepository: InMemoryProductAttachmentsRepository
let inMemoryProductsRepository: InMemoryProductsRepository
let inMemorySellersRepository: InMemorySellersRepository
let inMemoryCategoriesRepository: InMemoryCategoriesRepository
let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let sellerProfileFactory: SellerProfileFactory
let productDetailsFactory: ProductDetailsFactory
let attachmentMapper: AttachmentMapper
let sellerProfileMapper: SellerProfileMapper
let categoryMapper: CategoryMapper
let productDetailsMapper: ProductDetailsMapper
let sut: ChangeProductStatusUseCase

describe('Change Product Status', () => {
  beforeEach(() => {
    inMemoryProductAttachmentsRepository =
      new InMemoryProductAttachmentsRepository()
    inMemoryProductsRepository = new InMemoryProductsRepository(
      inMemoryProductAttachmentsRepository,
    )
    inMemorySellersRepository = new InMemorySellersRepository()
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository()
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    sellerProfileFactory = new SellerProfileFactory(
      inMemoryAttachmentsRepository,
    )
    productDetailsFactory = new ProductDetailsFactory(sellerProfileFactory)
    attachmentMapper = new AttachmentMapper()
    sellerProfileMapper = new SellerProfileMapper(attachmentMapper)
    categoryMapper = new CategoryMapper()
    productDetailsMapper = new ProductDetailsMapper(
      sellerProfileMapper,
      categoryMapper,
      attachmentMapper,
    )
    sut = new ChangeProductStatusUseCase(
      inMemoryProductsRepository,
      inMemorySellersRepository,
      inMemoryCategoriesRepository,
      inMemoryAttachmentsRepository,
      productDetailsFactory,
      productDetailsMapper,
    )
  })

  it('should be able to change product status without owner avatar and attachments', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
      status: ProductStatus.create(ProductStatusEnum.AVAILABLE),
    })
    await inMemoryProductsRepository.create(product)

    const result1 = await sut.execute({
      status: 'sold',
      productId: product.id.toString(),
      sellerId: seller.id.toString(),
    })

    expect(result1.isRight()).toBe(true)
    if (result1.isRight()) {
      expect(result1.value.productDetails).toMatchObject({
        productId: product.id.toString(),
        title: product.title,
        description: product.description,
        priceInCents: product.priceInCents.value,
        status: 'sold',
        owner: {
          sellerId: seller.id.toString(),
          name: seller.name,
          phone: seller.phone,
          email: seller.email,
          avatar: null,
        },
        category: {
          id: category.id.toString(),
          title: category.title,
          slug: category.slug.value,
        },
        attachments: [],
      })
    }

    const result2 = await sut.execute({
      status: 'available',
      productId: product.id.toString(),
      sellerId: seller.id.toString(),
    })

    expect(result2.isRight()).toBe(true)
    if (result2.isRight()) {
      expect(result2.value.productDetails).toMatchObject({
        productId: product.id.toString(),
        title: product.title,
        description: product.description,
        priceInCents: product.priceInCents.value,
        status: 'available',
        owner: {
          sellerId: seller.id.toString(),
          name: seller.name,
          phone: seller.phone,
          email: seller.email,
          avatar: null,
        },
        category: {
          id: category.id.toString(),
          title: category.title,
          slug: category.slug.value,
        },
        attachments: [],
      })
    }
  })

  it('should be able to change product status with owner avatar and attachments', async () => {
    const avatar = makeAttachment()
    await inMemoryAttachmentsRepository.create(avatar)
    const seller = makeSeller({ avatarId: avatar.id })
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const attachment1 = makeAttachment()
    const attachment2 = makeAttachment()
    await inMemoryAttachmentsRepository.create(attachment1)
    await inMemoryAttachmentsRepository.create(attachment2)

    const product = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
      status: ProductStatus.create(ProductStatusEnum.AVAILABLE),
    })

    const productAttachmentList = new ProductAttachmentList([
      ProductAttachment.create({
        attachmentId: attachment1.id,
        productId: product.id,
      }),
      ProductAttachment.create({
        attachmentId: attachment2.id,
        productId: product.id,
      }),
    ])

    product.attachments = productAttachmentList

    await inMemoryProductsRepository.create(product)

    const result1 = await sut.execute({
      status: 'sold',
      productId: product.id.toString(),
      sellerId: seller.id.toString(),
    })

    expect(result1.isRight()).toBe(true)
    if (result1.isRight()) {
      expect(result1.value.productDetails).toMatchObject({
        productId: product.id.toString(),
        title: product.title,
        description: product.description,
        priceInCents: product.priceInCents.value,
        status: 'sold',
        owner: {
          sellerId: seller.id.toString(),
          name: seller.name,
          phone: seller.phone,
          email: seller.email,
          avatar: { id: avatar.id.toString(), url: avatar.url },
        },
        category: {
          id: category.id.toString(),
          title: category.title,
          slug: category.slug.value,
        },
        attachments: [
          { id: attachment1.id.toString(), url: attachment1.url },
          { id: attachment2.id.toString(), url: attachment2.url },
        ],
      })
    }

    const result2 = await sut.execute({
      status: 'available',
      productId: product.id.toString(),
      sellerId: seller.id.toString(),
    })

    expect(result2.isRight()).toBe(true)
    if (result2.isRight()) {
      expect(result2.value.productDetails).toMatchObject({
        productId: product.id.toString(),
        title: product.title,
        description: product.description,
        priceInCents: product.priceInCents.value,
        status: 'available',
        owner: {
          sellerId: seller.id.toString(),
          name: seller.name,
          phone: seller.phone,
          email: seller.email,
          avatar: { id: avatar.id.toString(), url: avatar.url },
        },
        category: {
          id: category.id.toString(),
          title: category.title,
          slug: category.slug.value,
        },
        attachments: [
          { id: attachment1.id.toString(), url: attachment1.url },
          { id: attachment2.id.toString(), url: attachment2.url },
        ],
      })
    }
  })

  it('should return ResourceNotFoundError if seller does not exist', async () => {
    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product = makeProduct({
      ownerId: UniqueEntityID.create({ value: 'non-existent-owner-id' }),
      categoryId: category.id,
      status: ProductStatus.create(ProductStatusEnum.AVAILABLE),
    })
    await inMemoryProductsRepository.create(product)

    const result = await sut.execute({
      status: 'sold',
      productId: product.id.toString(),
      sellerId: 'non-existent-owner-id',
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
      status: 'sold',
      productId: 'non-existent-product-id',
      sellerId: seller.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return NotProductOwnerError if product does not belong to seller', async () => {
    const seller1 = makeSeller()
    await inMemorySellersRepository.create(seller1)
    const seller2 = makeSeller()
    await inMemorySellersRepository.create(seller2)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product = makeProduct({
      ownerId: seller1.id,
      categoryId: category.id,
      status: ProductStatus.create(ProductStatusEnum.AVAILABLE),
    })
    await inMemoryProductsRepository.create(product)

    const result = await sut.execute({
      status: 'sold',
      productId: product.id.toString(),
      sellerId: seller2.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotProductOwnerError)
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
      status: ProductStatus.create(ProductStatusEnum.AVAILABLE),
    })
    await inMemoryProductsRepository.create(product)

    const result = await sut.execute({
      status: 'invalid-status',
      productId: product.id.toString(),
      sellerId: seller.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidProductStatusError)
    }
  })

  it('should return ProductWithSameStatusError if product already has the same status', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
      status: ProductStatus.create(ProductStatusEnum.CANCELLED),
    })
    await inMemoryProductsRepository.create(product)

    const result = await sut.execute({
      status: 'cancelled',
      productId: product.id.toString(),
      sellerId: seller.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProductWithSameStatusError)
    }
  })

  it('should return ProductHasAlreadyBeenSoldError if status is cancelled and product has already been sold', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
      status: ProductStatus.create(ProductStatusEnum.SOLD),
    })
    await inMemoryProductsRepository.create(product)

    const result = await sut.execute({
      status: 'cancelled',
      productId: product.id.toString(),
      sellerId: seller.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProductHasAlreadyBeenSoldError)
    }
  })

  it('should return ProductHasAlreadyBeenCancelledError if status is sold and product has already been cancelled', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
      status: ProductStatus.create(ProductStatusEnum.CANCELLED),
    })
    await inMemoryProductsRepository.create(product)

    const result = await sut.execute({
      status: 'sold',
      productId: product.id.toString(),
      sellerId: seller.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProductHasAlreadyBeenCancelledError)
    }
  })

  it('should return ResourceNotFoundError if product category does not exist', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const product = makeProduct({
      ownerId: seller.id,
      categoryId: UniqueEntityID.create({ value: 'non-existent-category-id' }),
      status: ProductStatus.create(ProductStatusEnum.AVAILABLE),
    })
    await inMemoryProductsRepository.create(product)

    const result = await sut.execute({
      status: 'sold',
      productId: product.id.toString(),
      sellerId: seller.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should never include password field in the seller profile DTO', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
      status: ProductStatus.create(ProductStatusEnum.AVAILABLE),
    })
    await inMemoryProductsRepository.create(product)

    const result = await sut.execute({
      status: 'sold',
      productId: product.id.toString(),
      sellerId: seller.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.productDetails.owner).not.toHaveProperty('password')
    }
  })
})
