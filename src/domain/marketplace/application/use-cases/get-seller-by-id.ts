import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Seller } from '../../enterprise/entities/seller'
import { SellersRepository } from '../repositories/sellers-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

interface GetSellerByIdUseCaseRequest {
  sellerId: string
}

type GetSellerByIdUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    seller: Seller
  }
>

@Injectable()
export class GetSellerByIdUseCase {
  constructor(private sellersRepository: SellersRepository) {}

  async execute({
    sellerId,
  }: GetSellerByIdUseCaseRequest): Promise<GetSellerByIdUseCaseResponse> {
    const seller = await this.sellersRepository.findById(sellerId)

    if (!seller) {
      return left(new ResourceNotFoundError())
    }

    return right({
      seller,
    })
  }
}
