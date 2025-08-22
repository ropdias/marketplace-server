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
import { Attachment } from '../../enterprise/entities/attachment'

interface FetchRecentProductsUseCaseRequest {
  page?: number
  status?: string
  search?: string
}

type FetchRecentProductsUseCaseResponse = Either<
  ResourceNotFoundError | InvalidProductStatusError,
  {
    productDetailsList: ProductDetails[]
  }
>

@Injectable()
export class FetchRecentProductsUseCase {
  constructor(
    private productsRepository: ProductsRepository,
    private sellersRepository: SellersRepository,
    private categoriesRepository: CategoriesRepository,
    private attachmentsRepository: AttachmentsRepository,
    private productDetailsFactory: ProductDetailsFactory,
  ) {}

  async execute({
    page,
    status,
    search,
  }: FetchRecentProductsUseCaseRequest): Promise<FetchRecentProductsUseCaseResponse> {
    if (status && !ProductStatus.isValid(status)) {
      return left(new InvalidProductStatusError(status))
    }

    const products = await this.productsRepository.findManyRecent({
      page,
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
      productDetailsList = await this.buildProductDetailsFromProducts({
        products,
      })
      return right({ productDetailsList })
    } catch (error) {
      if (error instanceof ResourceNotFoundError) return left(error)
      throw error
    }
  }

  private async buildProductDetailsFromProducts({
    products,
  }: {
    products: Product[]
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

    // Get all sellers and create a mapper
    const sellerIds = products.map((product) => product.ownerId.toString())
    const sellers = await this.sellersRepository.findManyByIds(sellerIds)
    const sellersMap = new Map(sellers.map((s) => [s.id.toString(), s]))

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

        const seller = sellersMap.get(product.ownerId.toString())

        if (!seller) {
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
