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
import { RegisterProductViewUseCase } from './register-product-view'
import { InMemoryProductViewsRepository } from 'test/repositories/in-memory-product-views-repository'
import { makeProduct } from 'test/factories/make-product'
import { ProductAttachmentList } from '../../enterprise/entities/product-attachment-list'
import { ProductAttachment } from '../../enterprise/entities/product-attachment'
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
let sellerProfileFactory: SellerProfileFactory
let productDetailsFactory: ProductDetailsFactory
let sellerProfileAssembler: SellerProfileAssembler
let productDetailsAssembler: ProductDetailsAssembler
let attachmentMapper: AttachmentMapper
let sellerProfileMapper: SellerProfileMapper
let categoryMapper: CategoryMapper
let productDetailsMapper: ProductDetailsMapper
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
    sut = new RegisterProductViewUseCase(
      inMemoryProductViewsRepository,
      inMemoryProductsRepository,
      inMemorySellersRepository,
      sellerProfileAssembler,
      productDetailsAssembler,
      sellerProfileMapper,
      productDetailsMapper,
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
      expect(result.value.productDetails).toMatchObject({
        productId: product.id.toString(),
        title: product.title,
        description: product.description,
        priceInCents: product.priceInCents.value,
        status: product.status.value,
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
      expect(result.value.viewerProfile).toMatchObject({
        sellerId: viewer.id.toString(),
        name: viewer.name,
        phone: viewer.phone,
        email: viewer.email,
        avatar: null,
      })
      expect(inMemoryProductViewsRepository.items).toHaveLength(1)
      expect(inMemoryProductViewsRepository.items[0]).toMatchObject({
        productId: product.id,
        viewerId: viewer.id,
      })
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
      expect(result1.value.productDetails).toMatchObject({
        productId: product.id.toString(),
        title: product.title,
        description: product.description,
        priceInCents: product.priceInCents.value,
        status: product.status.value,
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
      expect(result1.value.viewerProfile).toMatchObject({
        sellerId: viewer1.id.toString(),
        name: viewer1.name,
        phone: viewer1.phone,
        email: viewer1.email,
        avatar: null,
      })
      expect(inMemoryProductViewsRepository.items).toHaveLength(1)
      expect(inMemoryProductViewsRepository.items[0]).toMatchObject({
        productId: product.id,
        viewerId: viewer1.id,
      })
    }

    const result2 = await sut.execute({
      productId: product.id.toString(),
      viewerId: viewer2.id.toString(),
    })

    expect(result2.isRight()).toBe(true)
    if (result2.isRight()) {
      expect(result2.value.productDetails).toMatchObject({
        productId: product.id.toString(),
        title: product.title,
        description: product.description,
        priceInCents: product.priceInCents.value,
        status: product.status.value,
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
      expect(result2.value.viewerProfile).toMatchObject({
        sellerId: viewer2.id.toString(),
        name: viewer2.name,
        phone: viewer2.phone,
        email: viewer2.email,
        avatar: null,
      })
      expect(inMemoryProductViewsRepository.items).toHaveLength(2)
      expect(inMemoryProductViewsRepository.items[0]).toMatchObject({
        productId: product.id,
        viewerId: viewer1.id,
      })
      expect(inMemoryProductViewsRepository.items[1]).toMatchObject({
        productId: product.id,
        viewerId: viewer2.id,
      })
    }
  })

  it('should be able to create a product view with owner avatar, viewer avatar and attachments', async () => {
    const avatar1 = makeAttachment()
    await inMemoryAttachmentsRepository.create(avatar1)
    const seller = makeSeller({ avatarId: avatar1.id })
    await inMemorySellersRepository.create(seller)

    const avatar2 = makeAttachment()
    await inMemoryAttachmentsRepository.create(avatar2)
    const viewer = makeSeller({ avatarId: avatar2.id })
    await inMemorySellersRepository.create(viewer)

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

    const result = await sut.execute({
      productId: product.id.toString(),
      viewerId: viewer.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.productDetails).toMatchObject({
        productId: product.id.toString(),
        title: product.title,
        description: product.description,
        priceInCents: product.priceInCents.value,
        status: product.status.value,
        owner: {
          sellerId: seller.id.toString(),
          name: seller.name,
          phone: seller.phone,
          email: seller.email,
          avatar: { id: avatar1.id.toString(), url: avatar1.url },
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
      expect(result.value.viewerProfile).toMatchObject({
        sellerId: viewer.id.toString(),
        name: viewer.name,
        phone: viewer.phone,
        email: viewer.email,
        avatar: { id: avatar2.id.toString(), url: avatar2.url },
      })
      expect(inMemoryProductViewsRepository.items).toHaveLength(1)
      expect(inMemoryProductViewsRepository.items[0]).toMatchObject({
        productId: product.id,
        viewerId: viewer.id,
      })
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
      expect(result1.value.productDetails).toMatchObject({
        productId: product.id.toString(),
        title: product.title,
        description: product.description,
        priceInCents: product.priceInCents.value,
        status: product.status.value,
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
      expect(result1.value.viewerProfile).toMatchObject({
        sellerId: viewer.id.toString(),
        name: viewer.name,
        phone: viewer.phone,
        email: viewer.email,
        avatar: null,
      })
      expect(inMemoryProductViewsRepository.items).toHaveLength(1)
      expect(inMemoryProductViewsRepository.items[0]).toMatchObject({
        productId: product.id,
        viewerId: viewer.id,
      })
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

  it('should return ResourceNotFoundError if category does not exist', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)
    const viewer = makeSeller()
    await inMemorySellersRepository.create(viewer)

    const product = makeProduct({
      ownerId: seller.id,
      categoryId: UniqueEntityID.create({ value: 'non-existent-category-id' }),
    })
    await inMemoryProductsRepository.create(product)

    const result = await sut.execute({
      productId: product.id.toString(),
      viewerId: viewer.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return ResourceNotFoundError if seller does not exist', async () => {
    const viewer = makeSeller()
    await inMemorySellersRepository.create(viewer)

    const category = makeCategory()
    await inMemoryCategoriesRepository.create(category)

    const product = makeProduct({
      ownerId: UniqueEntityID.create({ value: 'non-existent-owner-id' }),
      categoryId: category.id,
    })
    await inMemoryProductsRepository.create(product)

    const result = await sut.execute({
      productId: product.id.toString(),
      viewerId: viewer.id.toString(),
    })

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
    const viewer = makeSeller({
      avatarId: UniqueEntityID.create({
        value: 'non-existent-attachment-id',
      }),
    })
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
      expect(result.value.productDetails.owner.avatar).toBeNull()
      expect(result.value.viewerProfile.avatar).toBeNull()
    }
  })

  it('should never include password field in the seller profile DTO', async () => {
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
      expect(result.value.productDetails.owner).not.toHaveProperty('password')
      expect(result.value.viewerProfile).not.toHaveProperty('password')
    }
  })
})
