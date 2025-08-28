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

interface ProductDetailsAssemblerRequest {
  product: Product
}

type ProductDetailsAssemblerResponse = Either<
  ResourceNotFoundError,
  ProductDetails
>

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
  }: ProductDetailsAssemblerRequest): Promise<ProductDetailsAssemblerResponse> {
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
}
