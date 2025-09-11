import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { ProductsRepository } from '../repositories/products-repository'
import {
  ProductStatus,
  ProductStatusEnum,
} from '../../enterprise/entities/value-objects/product-status'
import { InvalidProductStatusError } from './errors/invalid-product-status-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { ProductDetailsDTO } from '../dtos/product-details-dtos'
import { ProductDetailsMapper } from '../mappers/product-details-mapper'
import { ProductDetailsAssembler } from '../assemblers/product-details-assembler'

interface FetchRecentProductsUseCaseRequest {
  page?: number
  status?: string
  search?: string
}

type FetchRecentProductsUseCaseResponse = Either<
  ResourceNotFoundError | InvalidProductStatusError,
  {
    productDetailsList: ProductDetailsDTO[]
  }
>

@Injectable()
export class FetchRecentProductsUseCase {
  constructor(
    private productsRepository: ProductsRepository,
    private productDetailsAssembler: ProductDetailsAssembler,
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

    let productDetailsDTOList: ProductDetailsDTO[] = []

    if (products.length === 0) {
      return right({ productDetailsList: [] })
    }

    const productDetailsListEither =
      await this.productDetailsAssembler.assembleMany({
        products,
      })
    if (productDetailsListEither.isLeft())
      return left(productDetailsListEither.value)

    productDetailsDTOList = productDetailsListEither.value.map(
      (productDetails) => ProductDetailsMapper.toDTO(productDetails),
    )

    return right({ productDetailsList: productDetailsDTOList })
  }
}
