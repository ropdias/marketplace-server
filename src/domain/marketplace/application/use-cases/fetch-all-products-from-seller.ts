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
import { ProductDetailsDTO } from '../dtos/product-details-dtos'
import { ProductDetailsMapper } from '../mappers/product-details-mapper'

interface FetchAllProductsFromSellerUseCaseRequest {
  sellerId: string
  status?: string
  search?: string
}

type FetchAllProductsFromSellerUseCaseResponse = Either<
  ResourceNotFoundError | InvalidProductStatusError,
  {
    productDetailsList: ProductDetailsDTO[]
  }
>

@Injectable()
export class FetchAllProductsFromSellerUseCase {
  constructor(
    private productsRepository: ProductsRepository,
    private sellersRepository: SellersRepository,
  ) {}

  async execute({
    sellerId,
    status,
    search,
  }: FetchAllProductsFromSellerUseCaseRequest): Promise<FetchAllProductsFromSellerUseCaseResponse> {
    const seller = await this.sellersRepository.findById(sellerId)

    if (!seller) {
      return left(new ResourceNotFoundError('Seller not found.'))
    }

    if (status && !ProductStatus.isValid(status)) {
      return left(new InvalidProductStatusError())
    }

    const products =
      await this.productsRepository.findManyProductDetailsBySellerId({
        sellerId,
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
