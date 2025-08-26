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
import { EditProductUseCase } from './edit-product'
import { NotProductOwnerError } from './errors/not-product-owner-error'
import { ProductAlreadySoldError } from './errors/produc-already-sold-error'
import {
  ProductStatus,
  ProductStatusEnum,
} from '../../enterprise/entities/value-objects/product-status'

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
let sut: EditProductUseCase

describe('Edit Product', () => {
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
    sut = new EditProductUseCase(
      inMemoryProductsRepository,
      inMemorySellersRepository,
      inMemoryCategoriesRepository,
      inMemoryAttachmentsRepository,
      inMemoryProductAttachmentsRepository,
      productDetailsFactory,
      productDetailsMapper,
    )
  })

  it('should be able to edit a product without owner avatar and attachments', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    await inMemoryProductsRepository.create(product)

    const newCategory = makeCategory()
    await inMemoryCategoriesRepository.create(newCategory)

    const result = await sut.execute({
      productId: product.id.toString(),
      title: 'New Title',
      categoryId: newCategory.id.toString(),
      description: 'New Description',
      priceInCents: 2000,
      attachmentsIds: [],
      sellerId: seller.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.productDetails).toMatchObject({
        productId: product.id.toString(),
        title: 'New Title',
        description: 'New Description',
        priceInCents: 2000,
        status: product.status.value,
        owner: {
          sellerId: seller.id.toString(),
          name: seller.name,
          phone: seller.phone,
          email: seller.email,
          avatar: null,
        },
        category: {
          id: newCategory.id.toString(),
          title: newCategory.title,
          slug: newCategory.slug.value,
        },
        attachments: [],
      })
    }
  })

  it('should be able to edit a product with owner avatar and without attachments', async () => {
    const avatar = makeAttachment()
    await inMemoryAttachmentsRepository.create(avatar)
    const seller = makeSeller({ avatarId: avatar.id })
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    await inMemoryProductsRepository.create(product)

    const newCategory = makeCategory()
    await inMemoryCategoriesRepository.create(newCategory)

    const result = await sut.execute({
      productId: product.id.toString(),
      title: 'New Title',
      categoryId: newCategory.id.toString(),
      description: 'New Description',
      priceInCents: 2000,
      attachmentsIds: [],
      sellerId: seller.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.productDetails).toMatchObject({
        productId: product.id.toString(),
        title: 'New Title',
        description: 'New Description',
        priceInCents: 2000,
        status: product.status.value,
        owner: {
          sellerId: seller.id.toString(),
          name: seller.name,
          phone: seller.phone,
          email: seller.email,
          avatar: { id: avatar.id.toString(), url: avatar.url },
        },
        category: {
          id: newCategory.id.toString(),
          title: newCategory.title,
          slug: newCategory.slug.value,
        },
        attachments: [],
      })
    }
  })

  it('should be able to edit a product with owner avatar and new attachments', async () => {
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

    const newCategory = makeCategory()
    await inMemoryCategoriesRepository.create(newCategory)

    const attachment3 = makeAttachment()
    const attachment4 = makeAttachment()
    await inMemoryAttachmentsRepository.create(attachment3)
    await inMemoryAttachmentsRepository.create(attachment4)

    const result = await sut.execute({
      productId: product.id.toString(),
      title: 'New Title',
      categoryId: newCategory.id.toString(),
      description: 'New Description',
      priceInCents: 2000,
      attachmentsIds: [
        attachment3.id.toString(),
        attachment1.id.toString(),
        attachment4.id.toString(),
      ],
      sellerId: seller.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.productDetails).toMatchObject({
        productId: product.id.toString(),
        title: 'New Title',
        description: 'New Description',
        priceInCents: 2000,
        status: product.status.value,
        owner: {
          sellerId: seller.id.toString(),
          name: seller.name,
          phone: seller.phone,
          email: seller.email,
          avatar: { id: avatar.id.toString(), url: avatar.url },
        },
        category: {
          id: newCategory.id.toString(),
          title: newCategory.title,
          slug: newCategory.slug.value,
        },
        attachments: [
          { id: attachment1.id.toString(), url: attachment1.url },
          { id: attachment3.id.toString(), url: attachment3.url },
          { id: attachment4.id.toString(), url: attachment4.url },
        ],
      })
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

    const newCategory = makeCategory()
    await inMemoryCategoriesRepository.create(newCategory)

    const result = await sut.execute({
      productId: product.id.toString(),
      title: 'New Title',
      categoryId: newCategory.id.toString(),
      description: 'New Description',
      priceInCents: 2000,
      attachmentsIds: [],
      sellerId: 'non-existent-owner-id',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return ResourceNotFoundError if new category does not exist', async () => {
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
      title: 'New Title',
      categoryId: 'non-existent-category-id',
      description: 'New Description',
      priceInCents: 2000,
      attachmentsIds: [],
      sellerId: seller.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return ResourceNotFoundError if new attachments do not exist', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    await inMemoryProductsRepository.create(product)

    const newCategory = makeCategory()
    await inMemoryCategoriesRepository.create(newCategory)

    const attachment1 = makeAttachment()
    const attachment2 = makeAttachment()

    const result = await sut.execute({
      productId: product.id.toString(),
      title: 'New Title',
      categoryId: newCategory.id.toString(),
      description: 'New Description',
      priceInCents: 2000,
      attachmentsIds: [attachment1.id.toString(), attachment2.id.toString()],
      sellerId: seller.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return ResourceNotFoundError if the product does not exist', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    await inMemoryProductsRepository.create(product)

    const newCategory = makeCategory()
    await inMemoryCategoriesRepository.create(newCategory)

    const result = await sut.execute({
      productId: product.id.toString() + '-non-existent',
      title: 'New Title',
      categoryId: newCategory.id.toString(),
      description: 'New Description',
      priceInCents: 2000,
      attachmentsIds: [],
      sellerId: seller.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return NotProductOwnerError if the product does not belong to seller', async () => {
    const seller1 = makeSeller()
    await inMemorySellersRepository.create(seller1)
    const seller2 = makeSeller()
    await inMemorySellersRepository.create(seller2)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product = makeProduct({
      ownerId: seller1.id,
      categoryId: category.id,
    })
    await inMemoryProductsRepository.create(product)

    const newCategory = makeCategory()
    await inMemoryCategoriesRepository.create(newCategory)

    const result = await sut.execute({
      productId: product.id.toString(),
      title: 'New Title',
      categoryId: newCategory.id.toString(),
      description: 'New Description',
      priceInCents: 2000,
      attachmentsIds: [],
      sellerId: seller2.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotProductOwnerError)
    }
  })

  it('should return ProductAlreadySoldError if the product has already been sold', async () => {
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

    const newCategory = makeCategory()
    await inMemoryCategoriesRepository.create(newCategory)

    const result = await sut.execute({
      productId: product.id.toString(),
      title: 'New Title',
      categoryId: newCategory.id.toString(),
      description: 'New Description',
      priceInCents: 2000,
      attachmentsIds: [],
      sellerId: seller.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProductAlreadySoldError)
    }
  })

  it('should return owner profile with avatar = null if avatarId points to non-existent attachment', async () => {
    const seller = makeSeller({
      avatarId: UniqueEntityID.create({
        value: 'non-existent-attachment-id',
      }),
    })
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    await inMemoryProductsRepository.create(product)

    const newCategory = makeCategory()
    await inMemoryCategoriesRepository.create(newCategory)

    const result = await sut.execute({
      productId: product.id.toString(),
      title: 'New Title',
      categoryId: newCategory.id.toString(),
      description: 'New Description',
      priceInCents: 2000,
      attachmentsIds: [],
      sellerId: seller.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.productDetails.owner.avatar).toBeNull()
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
    })
    await inMemoryProductsRepository.create(product)

    const newCategory = makeCategory()
    await inMemoryCategoriesRepository.create(newCategory)

    const result = await sut.execute({
      productId: product.id.toString(),
      title: 'New Title',
      categoryId: newCategory.id.toString(),
      description: 'New Description',
      priceInCents: 2000,
      attachmentsIds: [],
      sellerId: seller.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.productDetails.owner).not.toHaveProperty('password')
    }
  })
})
