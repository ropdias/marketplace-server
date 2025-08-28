import { makeSeller } from 'test/factories/make-seller'
import { InMemorySellersRepository } from 'test/repositories/in-memory-sellers-repository'
import { SellerProfileFactory } from '../factories/seller-profile-factory'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { SellerProfileMapper } from '../mappers/seller-profile-mapper'
import { AttachmentMapper } from '../mappers/attachment-mapper'
import { GetProductDetailsUseCase } from './get-product-details'
import { InMemoryProductsRepository } from 'test/repositories/in-memory-products-repository'
import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { InMemoryProductAttachmentsRepository } from 'test/repositories/in-memory-product-attachments-repository'
import { ProductDetailsFactory } from '../factories/product-details-factory'
import { ProductDetailsMapper } from '../mappers/product-details-mapper'
import { CategoryMapper } from '../mappers/category-mapper'
import { makeProduct } from 'test/factories/make-product'
import { makeCategory } from 'test/factories/make-category'
import { SellerProfileAssembler } from '../assemblers/seller-profile-assembler'
import { ProductDetailsAssembler } from '../assemblers/product-details-assembler'

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
let sut: GetProductDetailsUseCase

describe('Get Product Details', () => {
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
    sut = new GetProductDetailsUseCase(
      inMemoryProductsRepository,
      productDetailsMapper,
      productDetailsAssembler,
    )
  })

  it('should be able to get product details', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })
    await inMemoryProductsRepository.create(product)

    const result = await sut.execute({ productId: product.id.toString() })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const sellerProfile = sellerProfileFactory.create({
        seller,
        avatar: null,
      })
      const productDetails = productDetailsFactory.create({
        product,
        ownerProfile: sellerProfile,
        category,
        attachments: [],
      })
      const productDetailsDTO = productDetailsMapper.toDTO(productDetails)
      expect(result.value.productDetails).toMatchObject(productDetailsDTO)
    }
  })

  it('should return ResourceNotFoundError if product does not exist', async () => {
    const result = await sut.execute({ productId: 'non-existent-id' })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })
})
