import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { SellersRepository } from '../repositories/sellers-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { ProductViewsRepository } from '../repositories/product-views-repository'
import { ProductsRepository } from '../repositories/products-repository'
import { dayjs } from '@/core/libs/dayjs'

interface CountProductViewsPerDayLast30DaysRequest {
  sellerId: string
}

type CountProductViewsPerDayLast30DaysResponse = Either<
  ResourceNotFoundError,
  { viewsPerDay: { date: Date; amount: number }[] }
>

@Injectable()
export class CountProductViewsPerDayLast30DaysUseCase {
  constructor(
    private productViewsRepository: ProductViewsRepository,
    private sellersRepository: SellersRepository,
    private productsRepository: ProductsRepository,
  ) {}

  async execute({
    sellerId,
  }: CountProductViewsPerDayLast30DaysRequest): Promise<CountProductViewsPerDayLast30DaysResponse> {
    const seller = await this.sellersRepository.findById(sellerId)

    if (!seller) {
      return left(new ResourceNotFoundError())
    }

    const products = await this.productsRepository.findManyBySellerId({
      sellerId,
    })

    const since = dayjs().utc().startOf('day').subtract(30, 'day').toDate()

    const viewsPerDay = await this.productViewsRepository.countViewsPerDaySince(
      {
        productIds: products.map((product) => product.id.toString()),
        since,
      },
    )

    return right({
      viewsPerDay,
    })
  }
}
