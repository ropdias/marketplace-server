import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { ProductsRepository } from '../repositories/products-repository'
import { ProductDetails } from '../../enterprise/entities/value-objects/product-details'
import { ProductDetailsFactory } from '../factories/product-details-factory'
import { SellersRepository } from '../repositories/sellers-repository'
import { CategoriesRepository } from '../repositories/categories-repository'
import { AttachmentsRepository } from '../repositories/attachments-repository'
import { NotProductOwnerError } from './errors/not-product-owner-error'
import {
  ProductStatus,
  ProductStatusEnum,
} from '../../enterprise/entities/value-objects/product-status'
import { InvalidProductStatusError } from './errors/invalid-product-status-error'
import { ProductWithSameStatusError } from './errors/product-with-same-status-error'
import { ProductHasAlreadyBeenSoldError } from './errors/product-has-already-been-sold-error'
import { ProductHasAlreadyBeenCancelledError } from './errors/product-has-already-been-cancelled-error'

interface ChangeProductStatusUseCaseRequest {
  status: string
  productId: string
  sellerId: string
}

type ChangeProductStatusUseCaseResponse = Either<
  | ResourceNotFoundError
  | NotProductOwnerError
  | InvalidProductStatusError
  | ProductWithSameStatusError
  | ProductHasAlreadyBeenSoldError
  | ProductHasAlreadyBeenCancelledError,
  {
    productDetails: ProductDetails
  }
>

@Injectable()
export class ChangeProductStatusUseCase {
  constructor(
    private productsRepository: ProductsRepository,
    private sellersRepository: SellersRepository,
    private categoriesRepository: CategoriesRepository,
    private attachmentsRepository: AttachmentsRepository,
    private productDetailsFactory: ProductDetailsFactory,
  ) {}

  async execute({
    status,
    productId,
    sellerId,
  }: ChangeProductStatusUseCaseRequest): Promise<ChangeProductStatusUseCaseResponse> {
    const seller = await this.sellersRepository.findById(sellerId)

    if (!seller) {
      return left(new ResourceNotFoundError())
    }

    const product = await this.productsRepository.findById(productId)

    if (!product) {
      return left(new ResourceNotFoundError())
    }

    if (product.ownerId.toString() !== sellerId) {
      return left(new NotProductOwnerError())
    }

    if (!ProductStatus.isValid(status)) {
      return left(new InvalidProductStatusError(status))
    }

    const newStatus = ProductStatus.create(status as ProductStatusEnum)

    if (newStatus.value === product.status.value) {
      return left(new ProductWithSameStatusError())
    }

    if (
      newStatus.value === ProductStatusEnum.CANCELLED &&
      product.status.value === ProductStatusEnum.SOLD
    ) {
      return left(new ProductHasAlreadyBeenSoldError())
    }

    if (
      newStatus.value === ProductStatusEnum.SOLD &&
      product.status.value === ProductStatusEnum.CANCELLED
    ) {
      return left(new ProductHasAlreadyBeenCancelledError())
    }

    product.status = newStatus

    const [category, attachments] = await Promise.all([
      this.categoriesRepository.findById(product.categoryId.toString()),
      this.attachmentsRepository.findManyByIds(
        product.attachments
          .getItems()
          .map((attachment) => attachment.attachmentId.toString()),
      ),
    ])

    if (!category) {
      return left(new ResourceNotFoundError())
    }

    const productDetails = await this.productDetailsFactory.create({
      product,
      seller,
      category,
      attachments,
    })

    await this.productsRepository.save(product)

    return right({
      productDetails,
    })
  }
}
