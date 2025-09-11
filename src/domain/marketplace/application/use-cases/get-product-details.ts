import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { ProductsRepository } from '../repositories/products-repository'
import { ProductDetailsDTO } from '../dtos/product-details-dtos'
import { ProductDetailsMapper } from '../mappers/product-details-mapper'
import { ProductDetailsAssembler } from '../assemblers/product-details-assembler'

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
  constructor(
    private productsRepository: ProductsRepository,
    private productDetailsAssembler: ProductDetailsAssembler,
  ) {}

  async execute({
    productId,
  }: GetProductDetailsUseCaseRequest): Promise<GetProductDetailsUseCaseResponse> {
    const product = await this.productsRepository.findById(productId)

    if (!product) {
      return left(new ResourceNotFoundError())
    }

    const productDetailsEither = await this.productDetailsAssembler.assemble({
      product,
    })
    if (productDetailsEither.isLeft()) return left(productDetailsEither.value)

    const productDetailsDTO = ProductDetailsMapper.toDTO(
      productDetailsEither.value,
    )

    return right({
      productDetails: productDetailsDTO,
    })
  }
}
