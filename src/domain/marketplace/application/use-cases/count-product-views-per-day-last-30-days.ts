import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { SellersRepository } from '../repositories/sellers-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { ProductViewsRepository } from '../repositories/product-views-repository'
import { ProductsRepository } from '../repositories/products-repository'

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

    const viewsPerDay = await this.productViewsRepository.countViewsPerDaySince(
      {
        productIds: products.map((product) => product.id.toString()),
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    )

    return right({
      viewsPerDay,
    })
  }
}
