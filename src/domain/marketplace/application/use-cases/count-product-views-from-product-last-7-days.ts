import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { SellersRepository } from '../repositories/sellers-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { ProductViewsRepository } from '../repositories/product-views-repository'
import { ProductsRepository } from '../repositories/products-repository'
import { dayjs } from '@/core/libs/dayjs'

interface CountProductViewsFromProductLast7DaysRequest {
  sellerId: string
  productId: string
}

type CountProductViewsFromProductLast7DaysResponse = Either<
  ResourceNotFoundError,
  { amount: number }
>

@Injectable()
export class CountProductViewsFromProductLast7DaysUseCase {
  constructor(
    private productViewsRepository: ProductViewsRepository,
    private sellersRepository: SellersRepository,
    private productsRepository: ProductsRepository,
  ) {}

  async execute({
    sellerId,
    productId,
  }: CountProductViewsFromProductLast7DaysRequest): Promise<CountProductViewsFromProductLast7DaysResponse> {
    const seller = await this.sellersRepository.findById(sellerId)

    if (!seller) {
      return left(new ResourceNotFoundError())
    }

    const product = await this.productsRepository.findById(productId)

    if (!product) {
      return left(new ResourceNotFoundError())
    }

    const since = dayjs().utc().startOf('day').subtract(7, 'day').toDate()

    const amount = await this.productViewsRepository.countViewsFromProductSince(
      {
        productId,
        since,
      },
    )

    return right({
      amount,
    })
  }
}
