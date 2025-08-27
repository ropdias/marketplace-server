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
import { FetchAllProductsFromSellerUseCase } from './fetch-all-products-from-seller'
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
let attachmentMapper: AttachmentMapper
let sellerProfileMapper: SellerProfileMapper
let categoryMapper: CategoryMapper
let productDetailsMapper: ProductDetailsMapper
let sut: FetchAllProductsFromSellerUseCase

describe('Fetch All Products From Seller', () => {
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
    sut = new FetchAllProductsFromSellerUseCase(
      inMemoryProductsRepository,
      inMemorySellersRepository,
      inMemoryCategoriesRepository,
      inMemoryAttachmentsRepository,
      productDetailsFactory,
      productDetailsMapper,
    )
  })

  it('should be able to fetch all products from seller without owner avatar and attachments', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product1 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    const product2 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    const product3 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    await inMemoryProductsRepository.create(product1)
    await inMemoryProductsRepository.create(product2)
    await inMemoryProductsRepository.create(product3)

    const result = await sut.execute({ sellerId: seller.id.toString() })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.productDetailsList).toMatchObject(
        [product1, product2, product3].map((p) => ({
          productId: p.id.toString(),
          title: p.title,
          description: p.description,
          priceInCents: p.priceInCents.value,
          status: p.status.value,
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
        })),
      )
    }
  })

  it('should be able to fetch all products from seller with owner avatar and without attachments', async () => {
    const avatar = makeAttachment()
    await inMemoryAttachmentsRepository.create(avatar)
    const seller = makeSeller({ avatarId: avatar.id })
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product1 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    const product2 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    const product3 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    await inMemoryProductsRepository.create(product1)
    await inMemoryProductsRepository.create(product2)
    await inMemoryProductsRepository.create(product3)

    const result = await sut.execute({ sellerId: seller.id.toString() })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.productDetailsList).toMatchObject(
        [product1, product2, product3].map((p) => ({
          productId: p.id.toString(),
          title: p.title,
          description: p.description,
          priceInCents: p.priceInCents.value,
          status: p.status.value,
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
        })),
      )
    }
  })

  it('should be able to fetch all products from seller with owner avatar and attachments', async () => {
    const avatar = makeAttachment()
    await inMemoryAttachmentsRepository.create(avatar)
    const seller = makeSeller({ avatarId: avatar.id })
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const attachment1 = makeAttachment()
    const attachment2 = makeAttachment()
    const attachment3 = makeAttachment()
    const attachment4 = makeAttachment()
    const attachment5 = makeAttachment()
    const attachment6 = makeAttachment()
    await inMemoryAttachmentsRepository.create(attachment1)
    await inMemoryAttachmentsRepository.create(attachment2)
    await inMemoryAttachmentsRepository.create(attachment3)
    await inMemoryAttachmentsRepository.create(attachment4)
    await inMemoryAttachmentsRepository.create(attachment5)
    await inMemoryAttachmentsRepository.create(attachment6)

    const product1 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    const product2 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    const product3 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })

    const productAttachmentList1 = new ProductAttachmentList([
      ProductAttachment.create({
        attachmentId: attachment1.id,
        productId: product1.id,
      }),
      ProductAttachment.create({
        attachmentId: attachment2.id,
        productId: product1.id,
      }),
    ])
    const productAttachmentList2 = new ProductAttachmentList([
      ProductAttachment.create({
        attachmentId: attachment3.id,
        productId: product2.id,
      }),
      ProductAttachment.create({
        attachmentId: attachment4.id,
        productId: product2.id,
      }),
    ])
    const productAttachmentList3 = new ProductAttachmentList([
      ProductAttachment.create({
        attachmentId: attachment5.id,
        productId: product3.id,
      }),
      ProductAttachment.create({
        attachmentId: attachment6.id,
        productId: product3.id,
      }),
    ])

    product1.attachments = productAttachmentList1
    product2.attachments = productAttachmentList2
    product3.attachments = productAttachmentList3

    await inMemoryProductsRepository.create(product1)
    await inMemoryProductsRepository.create(product2)
    await inMemoryProductsRepository.create(product3)

    const result = await sut.execute({ sellerId: seller.id.toString() })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.productDetailsList).toMatchObject(
        [product1, product2, product3].map((p) => ({
          productId: p.id.toString(),
          title: p.title,
          description: p.description,
          priceInCents: p.priceInCents.value,
          status: p.status.value,
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
          attachments: p.id.equals(product1.id)
            ? [
                { id: attachment1.id.toString(), url: attachment1.url },
                { id: attachment2.id.toString(), url: attachment2.url },
              ]
            : p.id.equals(product2.id)
              ? [
                  { id: attachment3.id.toString(), url: attachment3.url },
                  { id: attachment4.id.toString(), url: attachment4.url },
                ]
              : p.id.equals(product3.id)
                ? [
                    { id: attachment5.id.toString(), url: attachment5.url },
                    { id: attachment6.id.toString(), url: attachment6.url },
                  ]
                : [],
        })),
      )
    }
  })

  it('should be able to fetch all products from seller with status equal sold', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product1 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
      status: ProductStatus.create(ProductStatusEnum.SOLD),
    })
    const product2 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
      status: ProductStatus.create(ProductStatusEnum.AVAILABLE),
    })
    const product3 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
      status: ProductStatus.create(ProductStatusEnum.SOLD),
    })
    await inMemoryProductsRepository.create(product1)
    await inMemoryProductsRepository.create(product2)
    await inMemoryProductsRepository.create(product3)

    const result = await sut.execute({
      sellerId: seller.id.toString(),
      status: 'sold',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.productDetailsList).toMatchObject(
        [product1, product3].map((p) => ({
          productId: p.id.toString(),
          title: p.title,
          description: p.description,
          priceInCents: p.priceInCents.value,
          status: p.status.value,
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
        })),
      )
    }
  })

  it('should be able to fetch all products from seller with search query equal book', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product1 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
      title: 'Book 1',
    })
    const product2 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
      title: 'Phone 1',
    })
    const product3 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
      title: 'Book 2',
    })
    await inMemoryProductsRepository.create(product1)
    await inMemoryProductsRepository.create(product2)
    await inMemoryProductsRepository.create(product3)

    const result = await sut.execute({
      sellerId: seller.id.toString(),
      search: 'book',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.productDetailsList).toMatchObject(
        [product1, product3].map((p) => ({
          productId: p.id.toString(),
          title: p.title,
          description: p.description,
          priceInCents: p.priceInCents.value,
          status: p.status.value,
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
        })),
      )
    }
  })

  it('should be able to fetch all products from seller with with status equal sold and search query equal book', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product1 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
      title: 'Book 1',
      status: ProductStatus.create(ProductStatusEnum.AVAILABLE),
    })
    const product2 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
      title: 'Phone 1',
      status: ProductStatus.create(ProductStatusEnum.CANCELLED),
    })
    const product3 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
      title: 'Book 2',
      status: ProductStatus.create(ProductStatusEnum.SOLD),
    })
    await inMemoryProductsRepository.create(product1)
    await inMemoryProductsRepository.create(product2)
    await inMemoryProductsRepository.create(product3)

    const result = await sut.execute({
      sellerId: seller.id.toString(),
      search: 'book',
      status: 'sold',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.productDetailsList).toMatchObject(
        [product3].map((p) => ({
          productId: p.id.toString(),
          title: p.title,
          description: p.description,
          priceInCents: p.priceInCents.value,
          status: p.status.value,
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
        })),
      )
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

  it('should return ResourceNotFoundError if category from product is not found', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()

    const product = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    await inMemoryProductsRepository.create(product)

    const result = await sut.execute({ sellerId: seller.id.toString() })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
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

    const product1 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    const product2 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    const product3 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    await inMemoryProductsRepository.create(product1)
    await inMemoryProductsRepository.create(product2)
    await inMemoryProductsRepository.create(product3)

    const result = await sut.execute({ sellerId: seller.id.toString() })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.productDetailsList[0].owner.avatar).toBeNull()
      expect(result.value.productDetailsList[1].owner.avatar).toBeNull()
      expect(result.value.productDetailsList[2].owner.avatar).toBeNull()
    }
  })

  it('should never include password field in the seller profile DTO', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product1 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    const product2 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    const product3 = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    await inMemoryProductsRepository.create(product1)
    await inMemoryProductsRepository.create(product2)
    await inMemoryProductsRepository.create(product3)

    const result = await sut.execute({ sellerId: seller.id.toString() })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.productDetailsList[0].owner).not.toHaveProperty(
        'password',
      )
      expect(result.value.productDetailsList[1].owner).not.toHaveProperty(
        'password',
      )
      expect(result.value.productDetailsList[2].owner).not.toHaveProperty(
        'password',
      )
    }
  })
})
