import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { ProductsRepository } from '../repositories/products-repository'
import {
  ProductStatus,
  ProductStatusEnum,
} from '../../enterprise/entities/value-objects/product-status'
import { InvalidProductStatusError } from './errors/invalid-product-status-error'
import { SellersRepository } from '../repositories/sellers-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { ProductDetails } from '../../enterprise/entities/value-objects/product-details'
import { ProductDetailsFactory } from '../factories/product-details-factory'
import { CategoriesRepository } from '../repositories/categories-repository'
import { AttachmentsRepository } from '../repositories/attachments-repository'
import { Product } from '../../enterprise/entities/product'
import { Seller } from '../../enterprise/entities/seller'
import { Attachment } from '../../enterprise/entities/attachment'

interface FetchAllProductsFromSellerUseCaseRequest {
  sellerId: string
  status?: string
  search?: string
}

type FetchAllProductsFromSellerUseCaseResponse = Either<
  ResourceNotFoundError | InvalidProductStatusError,
  {
    productDetailsList: ProductDetails[]
  }
>

@Injectable()
export class FetchAllProductsFromSellerUseCase {
  constructor(
    private productsRepository: ProductsRepository,
    private sellersRepository: SellersRepository,
    private categoriesRepository: CategoriesRepository,
    private attachmentsRepository: AttachmentsRepository,
    private productDetailsFactory: ProductDetailsFactory,
  ) {}

  async execute({
    sellerId,
    status,
    search,
  }: FetchAllProductsFromSellerUseCaseRequest): Promise<FetchAllProductsFromSellerUseCaseResponse> {
    const seller = await this.sellersRepository.findById(sellerId)

    if (!seller) {
      return left(new ResourceNotFoundError())
    }

    if (status && !ProductStatus.isValid(status)) {
      return left(new InvalidProductStatusError(status))
    }

    const products = await this.productsRepository.findManyBySellerId({
      sellerId,
      status: status
        ? ProductStatus.create(status as ProductStatusEnum)
        : undefined,
      search,
    })

    let productDetailsList: ProductDetails[] = []

    if (products.length === 0) {
      return right({ productDetailsList: [] })
    }

    try {
      productDetailsList = await this.buildProductDetails({ products, seller })
      return right({ productDetailsList })
    } catch (error) {
      if (error instanceof ResourceNotFoundError) return left(error)
      throw error
    }
  }

  private async buildProductDetails({
    products,
    seller,
  }: {
    products: Product[]
    seller: Seller
  }): Promise<ProductDetails[]> {
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

    const productDetailsList = await Promise.all(
      products.map((product) => {
        const productAttachments = product.attachments
          .getItems()
          .map((item) => attachmentsMap.get(item.attachmentId.toString()))
          .filter((attachment): attachment is Attachment => !!attachment)

        const category = categoriesMap.get(product.categoryId.toString())

        if (!category) {
          throw new ResourceNotFoundError()
        }

        return this.productDetailsFactory.create({
          product,
          seller,
          category,
          attachments: productAttachments,
        })
      }),
    )

    return productDetailsList
  }
}
