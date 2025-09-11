import { AttachmentMapper } from './attachment-mapper'
import { SellerProfileMapper } from './seller-profile-mapper'
import { makeSeller } from 'test/factories/make-seller'
import { makeAttachment } from 'test/factories/make-attachment'
import { SellerProfile } from '../../enterprise/entities/value-objects/seller-profile'
import { ProductDetailsMapper } from './product-details-mapper'
import { CategoryMapper } from './category-mapper'
import { makeCategory } from 'test/factories/make-category'
import { makeProduct } from 'test/factories/make-product'
import { ProductDetails } from '../../enterprise/entities/value-objects/product-details'

describe('ProductDetailsMapper', () => {
  it('should map a product details to DTO', () => {
    const seller = makeSeller()
    const sellerProfile = SellerProfile.create({
      sellerId: seller.id,
      name: seller.name,
      phone: seller.phone,
      email: seller.email,
      avatar: null,
    })
    const category = makeCategory()
    const attachment1 = makeAttachment()
    const attachment2 = makeAttachment()

    const product = makeProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })

    const productDetails = ProductDetails.create({
      productId: product.id,
      title: product.title,
      description: product.description,
      priceInCents: product.priceInCents,
      status: product.status,
      owner: sellerProfile,
      category: category,
      attachments: [attachment1, attachment2],
    })

    const dto = ProductDetailsMapper.toDTO(productDetails)

    expect(dto).toEqual({
      productId: product.id.toString(),
      title: product.title,
      description: product.description,
      priceInCents: product.priceInCents.value,
      status: product.status.value,
      owner: SellerProfileMapper.toDTO(sellerProfile),
      category: CategoryMapper.toDTO(category),
      attachments: [attachment1, attachment2].map((attachment) =>
        AttachmentMapper.toDTO(attachment),
      ),
    })
  })
})
