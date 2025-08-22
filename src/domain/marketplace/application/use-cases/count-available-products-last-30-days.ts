import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { ProductsRepository } from '../repositories/products-repository'
import { SellersRepository } from '../repositories/sellers-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

interface CountAvailableProductsLast30DaysRequest {
  sellerId: string
}

type CountAvailableProductsLast30DaysResponse = Either<
  ResourceNotFoundError,
  { amount: number }
>

@Injectable()
export class CountAvailableProductsLast30DaysUseCase {
  constructor(
    private productsRepository: ProductsRepository,
    private sellersRepository: SellersRepository,
  ) {}

  async execute({
    sellerId,
  }: CountAvailableProductsLast30DaysRequest): Promise<CountAvailableProductsLast30DaysResponse> {
    const seller = await this.sellersRepository.findById(sellerId)

    if (!seller) {
      return left(new ResourceNotFoundError())
    }

    const amount = await this.productsRepository.countAvailableSince({
      ownerId: sellerId,
      since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    })

    return right({
      amount,
    })
  }
}
