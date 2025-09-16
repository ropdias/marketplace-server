import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { ProductsRepository } from '../repositories/products-repository'
import { SellersRepository } from '../repositories/sellers-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { dayjs } from '@/core/libs/dayjs'

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
      return left(new ResourceNotFoundError('Seller not found.'))
    }

    const since = dayjs().utc().startOf('day').subtract(30, 'day').toDate()

    const amount = await this.productsRepository.countSoldSince({
      ownerId: sellerId,
      since,
    })

    return right({
      amount,
    })
  }
}
