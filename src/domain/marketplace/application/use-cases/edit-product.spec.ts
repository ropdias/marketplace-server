import { makeSeller } from 'test/factories/make-seller'
import { InMemorySellersRepository } from 'test/repositories/in-memory-sellers-repository'
import { SellerProfileFactory } from '../factories/seller-profile-factory'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'
import { makeAttachment } from 'test/factories/make-attachment'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { InMemoryProductsRepository } from 'test/repositories/in-memory-products-repository'
import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { InMemoryProductAttachmentsRepository } from 'test/repositories/in-memory-product-attachments-repository'
import { ProductDetailsFactory } from '../factories/product-details-factory'
import { ProductDetailsMapper } from '../mappers/product-details-mapper'
import { makeProduct } from 'test/factories/make-product'
import { makeCategory } from 'test/factories/make-category'
import { ProductAttachmentList } from '../../enterprise/entities/product-attachment-list'
import { ProductAttachment } from '../../enterprise/entities/product-attachment'
import { EditProductUseCase } from './edit-product'
import { NotProductOwnerError } from './errors/not-product-owner-error'
import {
  ProductStatus,
  ProductStatusEnum,
} from '../../enterprise/entities/value-objects/product-status'
import { ProductHasAlreadyBeenSoldError } from './errors/product-has-already-been-sold-error'
import { SellerProfileAssembler } from '../assemblers/seller-profile-assembler'
import { ProductDetailsAssembler } from '../assemblers/product-details-assembler'

let inMemoryProductAttachmentsRepository: InMemoryProductAttachmentsRepository
let inMemoryProductsRepository: InMemoryProductsRepository
let inMemorySellersRepository: InMemorySellersRepository
let inMemoryCategoriesRepository: InMemoryCategoriesRepository
let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let sellerProfileAssembler: SellerProfileAssembler
let productDetailsAssembler: ProductDetailsAssembler
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
    sellerProfileAssembler = new SellerProfileAssembler(
      inMemoryAttachmentsRepository,
    )
    productDetailsAssembler = new ProductDetailsAssembler(
      inMemorySellersRepository,
      inMemoryCategoriesRepository,
      inMemoryAttachmentsRepository,
      sellerProfileAssembler,
    )
    sut = new EditProductUseCase(
      inMemoryProductsRepository,
      inMemorySellersRepository,
      inMemoryCategoriesRepository,
      inMemoryAttachmentsRepository,
      inMemoryProductAttachmentsRepository,
      productDetailsAssembler,
    )
  })

  it('should be able to edit a product without attachments', async () => {
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
      const editedProduct = inMemoryProductsRepository.items[0]
      const sellerProfile = SellerProfileFactory.create({
        seller,
        avatar: null,
      })
      const productDetails = ProductDetailsFactory.create({
        product: editedProduct,
        ownerProfile: sellerProfile,
        category: newCategory,
        attachments: [],
      })
      const productDetailsDTO = ProductDetailsMapper.toDTO(productDetails)
      expect(result.value.productDetails).toMatchObject(productDetailsDTO)

      expect(result.value.productDetails.title).toBe('New Title')
      expect(result.value.productDetails.category.id).toBe(
        newCategory.id.toString(),
      )
      expect(result.value.productDetails.description).toBe('New Description')
      expect(result.value.productDetails.priceInCents).toBe(2000)
    }
  })

  it('should be able to edit a product with new attachments', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const attachment1 = makeAttachment()
    const attachment2 = makeAttachment()
    await inMemoryAttachmentsRepository.createMany([attachment1, attachment2])

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
    await inMemoryAttachmentsRepository.createMany([attachment3, attachment4])

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
      const editedProduct = inMemoryProductsRepository.items[0]
      const sellerProfile = SellerProfileFactory.create({
        seller,
        avatar: null,
      })
      const productDetails = ProductDetailsFactory.create({
        product: editedProduct,
        ownerProfile: sellerProfile,
        category: newCategory,
        attachments: [attachment1, attachment3, attachment4],
      })
      const productDetailsDTO = ProductDetailsMapper.toDTO(productDetails)
      expect(result.value.productDetails).toMatchObject(productDetailsDTO)

      expect(result.value.productDetails.title).toBe('New Title')
      expect(result.value.productDetails.category.id).toBe(
        newCategory.id.toString(),
      )
      expect(result.value.productDetails.description).toBe('New Description')
      expect(result.value.productDetails.priceInCents).toBe(2000)
      expect(result.value.productDetails.attachments).toHaveLength(3)
      expect(result.value.productDetails.attachments[0].id).toBe(
        attachment1.id.toString(),
      )
      expect(result.value.productDetails.attachments[1].id).toBe(
        attachment3.id.toString(),
      )
      expect(result.value.productDetails.attachments[2].id).toBe(
        attachment4.id.toString(),
      )
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

  it('should return ProductHasAlreadyBeenSoldError if the product has already been sold', async () => {
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
      expect(result.value).toBeInstanceOf(ProductHasAlreadyBeenSoldError)
    }
  })
})
