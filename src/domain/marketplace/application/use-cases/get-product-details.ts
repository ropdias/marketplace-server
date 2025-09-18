import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { ProductsRepository } from '../repositories/products-repository'
import { ProductDetailsDTO } from '../dtos/product-details-dtos'
import { ProductDetailsMapper } from '../mappers/product-details-mapper'

interface GetProductDetailsUseCaseRequest {
  productId: string
}

type GetProductDetailsUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    productDetails: ProductDetailsDTO
  }
>

@Injectable()
export class GetProductDetailsUseCase {
  constructor(private productsRepository: ProductsRepository) {}

  async execute({
    productId,
  }: GetProductDetailsUseCaseRequest): Promise<GetProductDetailsUseCaseResponse> {
    const productDetails =
      await this.productsRepository.findProductDetailsById(productId)

    if (!productDetails) {
      return left(new ResourceNotFoundError('Product not found.'))
    }

    const productDetailsDTO = ProductDetailsMapper.toDTO(productDetails)

    return right({
      productDetails: productDetailsDTO,
    })
  }
}
