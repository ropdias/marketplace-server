import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { ProductsRepository } from '../repositories/products-repository'
import { SellersRepository } from '../repositories/sellers-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

interface CountSoldProductsLast30DaysRequest {
  sellerId: string
}

type CountSoldProductsLast30DaysResponse = Either<
  ResourceNotFoundError,
  { amount: number }
>

@Injectable()
export class CountSoldProductsLast30DaysUseCase {
  constructor(
    private productsRepository: ProductsRepository,
    private sellersRepository: SellersRepository,
  ) {}

  async execute({
    sellerId,
  }: CountSoldProductsLast30DaysRequest): Promise<CountSoldProductsLast30DaysResponse> {
    const seller = await this.sellersRepository.findById(sellerId)

    if (!seller) {
      return left(new ResourceNotFoundError())
    }

    const amount = await this.productsRepository.countSoldSince({
      ownerId: sellerId,
      since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    })

    return right({
      amount,
    })
  }
}
