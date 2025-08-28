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
import { makeCategory } from 'test/factories/make-category'
import { CreateProductUseCase } from './create-product'

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
let sut: CreateProductUseCase

describe('Create Product', () => {
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
    sut = new CreateProductUseCase(
      inMemoryProductsRepository,
      inMemorySellersRepository,
      inMemoryCategoriesRepository,
      inMemoryAttachmentsRepository,
      productDetailsFactory,
      productDetailsMapper,
    )
  })

  it('should be able to create a product without owner avatar and attachments', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const result = await sut.execute({
      title: 'Product',
      categoryId: category.id.toString(),
      description: 'Product description',
      priceInCents: 1000,
      attachmentsIds: [],
      sellerId: seller.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.productDetails).toMatchObject({
        productId: inMemoryProductsRepository.items[0].id.toString(),
        title: 'Product',
        description: 'Product description',
        priceInCents: 1000,
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

  it('should be able to create a product with owner avatar and without attachments', async () => {
    const avatar = makeAttachment()
    await inMemoryAttachmentsRepository.create(avatar)
    const seller = makeSeller({ avatarId: avatar.id })
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const result = await sut.execute({
      title: 'Product',
      categoryId: category.id.toString(),
      description: 'Product description',
      priceInCents: 1000,
      attachmentsIds: [],
      sellerId: seller.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.productDetails).toMatchObject({
        productId: inMemoryProductsRepository.items[0].id.toString(),
        title: 'Product',
        description: 'Product description',
        priceInCents: 1000,
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
        attachments: [],
      })
    }
  })

  it('should be able create a product with owner avatar and attachments', async () => {
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

    const result = await sut.execute({
      title: 'Product',
      categoryId: category.id.toString(),
      description: 'Product description',
      priceInCents: 1000,
      attachmentsIds: [attachment1.id.toString(), attachment2.id.toString()],
      sellerId: seller.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.productDetails).toMatchObject({
        productId: inMemoryProductsRepository.items[0].id.toString(),
        title: 'Product',
        description: 'Product description',
        priceInCents: 1000,
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

    const result = await sut.execute({
      title: 'Product',
      categoryId: category.id.toString(),
      description: 'Product description',
      priceInCents: 1000,
      attachmentsIds: [],
      sellerId: 'non-existent-seller-id',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return ResourceNotFoundError if category does not exist', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const result = await sut.execute({
      title: 'Product',
      categoryId: 'non-existent-category-id',
      description: 'Product description',
      priceInCents: 1000,
      attachmentsIds: [],
      sellerId: seller.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return ResourceNotFoundError if one attachment does not exist', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const attachment1 = makeAttachment()
    await inMemoryAttachmentsRepository.create(attachment1)
    const attachment2 = makeAttachment()
    await inMemoryAttachmentsRepository.create(attachment2)

    const result = await sut.execute({
      title: 'Product',
      categoryId: category.id.toString(),
      description: 'Product description',
      priceInCents: 1000,
      attachmentsIds: [
        attachment1.id.toString(),
        'non-existent-attachment-id',
        attachment2.id.toString(),
      ],
      sellerId: seller.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })
})
