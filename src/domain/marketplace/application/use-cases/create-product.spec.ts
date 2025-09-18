import { makeSeller } from 'test/factories/make-seller'
import { InMemorySellersRepository } from 'test/repositories/in-memory-sellers-repository'
import { SellerProfileFactory } from '../../../../../test/factories/seller-profile-factory'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'
import { makeAttachment } from 'test/factories/make-attachment'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { InMemoryProductsRepository } from 'test/repositories/in-memory-products-repository'
import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { InMemoryProductAttachmentsRepository } from 'test/repositories/in-memory-product-attachments-repository'
import { ProductDetailsFactory } from '../../../../../test/factories/product-details-factory'
import { ProductDetailsMapper } from '../mappers/product-details-mapper'
import { makeCategory } from 'test/factories/make-category'
import { CreateProductUseCase } from './create-product'
import { makeProduct } from 'test/factories/make-product'
import { PriceInCents } from '../../enterprise/entities/value-objects/price-in-cents'
import { ProductAttachmentList } from '../../enterprise/entities/product-attachment-list'
import { ProductAttachment } from '../../enterprise/entities/product-attachment'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

let inMemoryProductAttachmentsRepository: InMemoryProductAttachmentsRepository
let inMemoryProductsRepository: InMemoryProductsRepository
let inMemorySellersRepository: InMemorySellersRepository
let inMemoryCategoriesRepository: InMemoryCategoriesRepository
let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let sut: CreateProductUseCase

describe('Create Product', () => {
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
    sut = new CreateProductUseCase(
      inMemoryProductsRepository,
      inMemorySellersRepository,
      inMemoryCategoriesRepository,
      inMemoryAttachmentsRepository,
    )
  })

  it('should be able to create a product without attachments', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product = makeProduct({
      title: 'Product',
      categoryId: category.id,
      description: 'Product description',
      priceInCents: PriceInCents.create(1000),
      ownerId: seller.id,
    })

    const result = await sut.execute({
      title: product.title,
      categoryId: product.categoryId.toString(),
      description: product.description,
      priceInCents: product.priceInCents.value,
      attachmentsIds: product.attachments
        .getItems()
        .map((attachment) => attachment.id.toString()),
      sellerId: product.ownerId.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(inMemoryProductsRepository.items).toHaveLength(1)

      const createdProduct = inMemoryProductsRepository.items[0]
      const sellerProfile = SellerProfileFactory.create({
        seller,
        avatar: null,
      })
      const productDetails = ProductDetailsFactory.create({
        product: createdProduct,
        ownerProfile: sellerProfile,
        category,
        attachments: [],
      })
      const productDetailsDTO = ProductDetailsMapper.toDTO(productDetails)

      // VO/Entity equality
      expect(createdProduct.categoryId.equals(product.categoryId)).toBe(true)
      expect(createdProduct.priceInCents.equals(product.priceInCents)).toBe(
        true,
      )
      expect(createdProduct.status.equals(product.status)).toBe(true)
      expect(createdProduct.ownerId.equals(product.ownerId)).toBe(true)
      // Primitive equality
      expect(createdProduct.title).toBe(product.title)
      expect(createdProduct.description).toBe(product.description)

      expect(result.value.productDetails).toMatchObject(productDetailsDTO)
    }
  })

  it('should be able create a product with attachments', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const attachment1 = makeAttachment()
    const attachment2 = makeAttachment()
    await inMemoryAttachmentsRepository.createMany([attachment1, attachment2])

    const product = makeProduct({
      title: 'Product',
      categoryId: category.id,
      description: 'Product description',
      priceInCents: PriceInCents.create(1000),
      ownerId: seller.id,
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

    const result = await sut.execute({
      title: product.title,
      categoryId: product.categoryId.toString(),
      description: product.description,
      priceInCents: product.priceInCents.value,
      attachmentsIds: product.attachments
        .getItems()
        .map((attachment) => attachment.attachmentId.toString()),
      sellerId: product.ownerId.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(inMemoryProductsRepository.items).toHaveLength(1)

      const createdProduct = inMemoryProductsRepository.items[0]
      const sellerProfile = SellerProfileFactory.create({
        seller,
        avatar: null,
      })
      const productDetails = ProductDetailsFactory.create({
        product: createdProduct,
        ownerProfile: sellerProfile,
        category,
        attachments: [attachment1, attachment2],
      })
      const productDetailsDTO = ProductDetailsMapper.toDTO(productDetails)

      // VO/Entity equality
      expect(createdProduct.categoryId.equals(product.categoryId)).toBe(true)
      expect(createdProduct.priceInCents.equals(product.priceInCents)).toBe(
        true,
      )
      expect(createdProduct.status.equals(product.status)).toBe(true)
      expect(createdProduct.ownerId.equals(product.ownerId)).toBe(true)
      expect(
        createdProduct.attachments
          .getItems()[0]
          .attachmentId.equals(product.attachments.getItems()[0].attachmentId),
      ).toBe(true)
      expect(
        createdProduct.attachments
          .getItems()[1]
          .attachmentId.equals(product.attachments.getItems()[1].attachmentId),
      ).toBe(true)
      // Primitive equality
      expect(createdProduct.title).toBe(product.title)
      expect(createdProduct.description).toBe(product.description)

      expect(result.value.productDetails).toMatchObject(productDetailsDTO)
    }
  })

  it('should return ResourceNotFoundError if seller does not exist', async () => {
    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product = makeProduct({
      title: 'Product',
      categoryId: category.id,
      description: 'Product description',
      priceInCents: PriceInCents.create(1000),
      ownerId: UniqueEntityID.create({ value: 'non-existent-seller-id' }),
    })

    const result = await sut.execute({
      title: product.title,
      categoryId: product.categoryId.toString(),
      description: product.description,
      priceInCents: product.priceInCents.value,
      attachmentsIds: product.attachments
        .getItems()
        .map((attachment) => attachment.id.toString()),
      sellerId: product.ownerId.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return ResourceNotFoundError if category does not exist', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const product = makeProduct({
      title: 'Product',
      categoryId: UniqueEntityID.create({ value: 'non-existent-category-id' }),
      description: 'Product description',
      priceInCents: PriceInCents.create(1000),
      ownerId: seller.id,
    })

    const result = await sut.execute({
      title: product.title,
      categoryId: product.categoryId.toString(),
      description: product.description,
      priceInCents: product.priceInCents.value,
      attachmentsIds: product.attachments
        .getItems()
        .map((attachment) => attachment.id.toString()),
      sellerId: product.ownerId.toString(),
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
    const attachment2 = makeAttachment()
    await inMemoryAttachmentsRepository.createMany([attachment1, attachment2])

    const product = makeProduct({
      title: 'Product',
      categoryId: category.id,
      description: 'Product description',
      priceInCents: PriceInCents.create(1000),
      ownerId: seller.id,
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

    const result = await sut.execute({
      title: product.title,
      categoryId: product.categoryId.toString(),
      description: product.description,
      priceInCents: product.priceInCents.value,
      attachmentsIds: [
        ...product.attachments
          .getItems()
          .map((attachment) => attachment.attachmentId.toString()),
        'non-existent-attachment-id',
      ],
      sellerId: product.ownerId.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })
})
