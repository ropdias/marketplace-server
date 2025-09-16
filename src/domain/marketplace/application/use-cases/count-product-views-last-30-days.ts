import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { SellersRepository } from '../repositories/sellers-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { ProductViewsRepository } from '../repositories/product-views-repository'
import { ProductsRepository } from '../repositories/products-repository'
import { dayjs } from '@/core/libs/dayjs'

interface CountProductViewsLast30DaysRequest {
  sellerId: string
}

type CountProductViewsLast30DaysResponse = Either<
  ResourceNotFoundError,
  { amount: number }
>

@Injectable()
export class CountProductViewsLast30DaysUseCase {
  constructor(
    private productViewsRepository: ProductViewsRepository,
    private sellersRepository: SellersRepository,
    private productsRepository: ProductsRepository,
  ) {}

  async execute({
    sellerId,
  }: CountProductViewsLast30DaysRequest): Promise<CountProductViewsLast30DaysResponse> {
    const seller = await this.sellersRepository.findById(sellerId)

    if (!seller) {
      return left(new ResourceNotFoundError('Seller not found.'))
    }

    const products = await this.productsRepository.findManyBySellerId({
      sellerId,
    })

    const since = dayjs().utc().startOf('day').subtract(30, 'day').toDate()

    const amount =
      await this.productViewsRepository.countViewsFromProductsSince({
        productIds: products.map((product) => product.id.toString()),
        since,
      })

    return right({
      amount,
    })
  }
}
