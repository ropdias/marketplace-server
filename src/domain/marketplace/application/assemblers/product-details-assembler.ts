import { Injectable } from '@nestjs/common'
import { AttachmentsRepository } from '../repositories/attachments-repository'
import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { Product } from '../../enterprise/entities/product'
import { ProductDetails } from '../../enterprise/entities/value-objects/product-details'
import { SellersRepository } from '../repositories/sellers-repository'
import { CategoriesRepository } from '../repositories/categories-repository'
import { SellerProfileAssembler } from './seller-profile-assembler'
import { ProductDetailsFactory } from '../factories/product-details-factory'
import { Seller } from '../../enterprise/entities/seller'
import { Attachment } from '../../enterprise/entities/attachment'

@Injectable()
export class ProductDetailsAssembler {
  constructor(
    private sellersRepository: SellersRepository,
    private categoriesRepository: CategoriesRepository,
    private attachmentsRepository: AttachmentsRepository,
    private sellerProfileAssembler: SellerProfileAssembler,
    private productDetailsFactory: ProductDetailsFactory,
  ) {}

  async assemble({
    product,
  }: {
    product: Product
  }): Promise<Either<ResourceNotFoundError, ProductDetails>> {
    const [seller, category, attachments] = await Promise.all([
      this.sellersRepository.findById(product.ownerId.toString()),
      this.categoriesRepository.findById(product.categoryId.toString()),
      this.attachmentsRepository.findManyByIds(
        product.attachments
          .getItems()
          .map((attachment) => attachment.attachmentId.toString()),
      ),
    ])

    if (!seller || !category) return left(new ResourceNotFoundError())

    const ownerProfileEither = await this.sellerProfileAssembler.assemble({
      seller,
    })
    if (ownerProfileEither.isLeft()) return left(ownerProfileEither.value)

    const productDetails = this.productDetailsFactory.create({
      product,
      ownerProfile: ownerProfileEither.value,
      category,
      attachments,
    })

    return right(productDetails)
  }

  async assembleManyFromSeller({
    products,
    seller,
  }: {
    products: Product[]
    seller: Seller
  }): Promise<Either<ResourceNotFoundError, ProductDetails[]>> {
    // Get all categories and create a mapper
    const categories = await this.categoriesRepository.findAll()
    const categoriesMap = new Map(categories.map((c) => [c.id.toString(), c]))

    // Get all attachments and create a mapper
    const attachmentIds = products.flatMap((product) =>
      product.attachments
        .getItems()
        .map((attachment) => attachment.attachmentId.toString()),
    )
    const attachments =
      await this.attachmentsRepository.findManyByIds(attachmentIds)
    const attachmentsMap = new Map(
      attachments.map((attachment) => [attachment.id.toString(), attachment]),
    )

    const ownerProfileEither = await this.sellerProfileAssembler.assemble({
      seller,
    })
    if (ownerProfileEither.isLeft()) return left(ownerProfileEither.value)

    const productDetailsList: ProductDetails[] = []

    for (const product of products) {
      const productAttachments = product.attachments
        .getItems()
        .map((item) => attachmentsMap.get(item.attachmentId.toString()))
        .filter((attachment): attachment is Attachment => !!attachment)

      const category = categoriesMap.get(product.categoryId.toString())

      if (!category) {
        return left(new ResourceNotFoundError())
      }

      productDetailsList.push(
        this.productDetailsFactory.create({
          product,
          ownerProfile: ownerProfileEither.value,
          category,
          attachments: productAttachments,
        }),
      )
    }

    return right(productDetailsList)
  }
}
