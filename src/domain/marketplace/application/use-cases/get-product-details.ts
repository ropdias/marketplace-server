import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { ProductsRepository } from '../repositories/products-repository'
import { ProductDetails } from '../../enterprise/entities/value-objects/product-details'
import { ProductDetailsFactory } from '../factories/product-details-factory'
import { SellersRepository } from '../repositories/sellers-repository'
import { CategoriesRepository } from '../repositories/categories-repository'
import { AttachmentsRepository } from '../repositories/attachments-repository'

interface GetProductDetailsUseCaseRequest {
  productId: string
}

type GetProductDetailsUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    productDetails: ProductDetails
  }
>

@Injectable()
export class GetProductDetailsUseCase {
  constructor(
    private productsRepository: ProductsRepository,
    private sellersRepository: SellersRepository,
    private categoriesRepository: CategoriesRepository,
    private attachmentsRepository: AttachmentsRepository,
    private productDetailsFactory: ProductDetailsFactory,
  ) {}

  async execute({
    productId,
  }: GetProductDetailsUseCaseRequest): Promise<GetProductDetailsUseCaseResponse> {
    const product = await this.productsRepository.findById(productId)

    if (!product) {
      return left(new ResourceNotFoundError())
    }

    const [seller, category, attachments] = await Promise.all([
      this.sellersRepository.findById(product.ownerId.toString()),
      this.categoriesRepository.findById(product.categoryId.toString()),
      this.attachmentsRepository.findManyByIds(
        product.attachments
          .getItems()
          .map((attachment) => attachment.attachmentId.toString()),
      ),
    ])

    if (!seller || !category) {
      return left(new ResourceNotFoundError())
    }

    const productDetails = await this.productDetailsFactory.create({
      product,
      seller,
      category,
      attachments,
    })

    return right({
      productDetails,
    })
  }
}
