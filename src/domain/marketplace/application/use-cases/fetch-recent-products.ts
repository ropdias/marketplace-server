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
  constructor(private productsRepository: ProductsRepository) {}

  async execute({
    page,
    status,
    search,
  }: FetchRecentProductsUseCaseRequest): Promise<FetchRecentProductsUseCaseResponse> {
    if (status && !ProductStatus.isValid(status)) {
      return left(new InvalidProductStatusError())
    }

    const products =
      await this.productsRepository.findManyRecentProductDetailsByIds({
        page,
        status: status
          ? ProductStatus.create(status as ProductStatusEnum)
          : undefined,
        search,
      })

    if (products.length === 0) {
      return right({ productDetailsList: [] })
    }

    const productDetailsDTOList = products.map((productDetails) =>
      ProductDetailsMapper.toDTO(productDetails),
    )

    return right({ productDetailsList: productDetailsDTOList })
  }
}
