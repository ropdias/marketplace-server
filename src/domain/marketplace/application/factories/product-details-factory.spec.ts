import { makeSeller } from 'test/factories/make-seller'
import { SellerProfileFactory } from './seller-profile-factory'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'
import { ProductDetailsFactory } from './product-details-factory'
import { makeCategory } from 'test/factories/make-category'
import { makeProduct } from 'test/factories/make-product'
import { Attachment } from '../../enterprise/entities/attachment'
import { makeAttachment } from 'test/factories/make-attachment'

let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let sellerProfileFactory: SellerProfileFactory
let sut: ProductDetailsFactory

describe('SellerProfileFactory', () => {
  beforeEach(() => {
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    sellerProfileFactory = new SellerProfileFactory(
      inMemoryAttachmentsRepository,
    )
    sut = new ProductDetailsFactory(sellerProfileFactory)
  })

  it('should create a product details without attachments if attachment list is empty', async () => {
    const seller = makeSeller()
    const category = makeCategory()
    const product = makeProduct({ ownerId: seller.id, categoryId: category.id })
    const attachments: Attachment[] = []

    const ownerProfile = await sellerProfileFactory.create({ seller })

    const productDetails = await sut.create({
      product,
      seller,
      category,
      attachments,
    })

    // VO/Entity equality
    expect(productDetails.productId.equals(product.id)).toBe(true)
    expect(productDetails.priceInCents.equals(product.priceInCents)).toBe(true)
    expect(productDetails.status.equals(product.status)).toBe(true)
    expect(productDetails.owner.equals(ownerProfile)).toBe(true)
    expect(productDetails.category.equals(category)).toBe(true)
    // Primitive equality
    expect(productDetails.title).toBe(product.title)
    expect(productDetails.description).toBe(product.description)

    expect(productDetails.attachments).toHaveLength(0)
  })

  it('should create a product details with attachments', async () => {
    const seller = makeSeller()
    const category = makeCategory()
    const product = makeProduct({ ownerId: seller.id, categoryId: category.id })
    const attachments: Attachment[] = [makeAttachment(), makeAttachment()]

    const ownerProfile = await sellerProfileFactory.create({ seller })

    const productDetails = await sut.create({
      product,
      seller,
      category,
      attachments,
    })

    // VO/Entity equality
    expect(productDetails.productId.equals(product.id)).toBe(true)
    expect(productDetails.priceInCents.equals(product.priceInCents)).toBe(true)
    expect(productDetails.status.equals(product.status)).toBe(true)
    expect(productDetails.owner.equals(ownerProfile)).toBe(true)
    expect(productDetails.category.equals(category)).toBe(true)
    expect(productDetails.attachments[0].equals(attachments[0])).toBe(true)
    expect(productDetails.attachments[1].equals(attachments[1])).toBe(true)
    // Primitive equality
    expect(productDetails.title).toBe(product.title)
    expect(productDetails.description).toBe(product.description)

    expect(productDetails.attachments).toHaveLength(2)
  })
})
