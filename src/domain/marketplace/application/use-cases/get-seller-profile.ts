import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { SellersRepository } from '../repositories/sellers-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { SellerProfile } from '../../enterprise/entities/value-objects/seller-profile'
import { SellerProfileFactory } from '../factories/seller-profile-factory'

interface GetSellerProfileUseCaseRequest {
  sellerId: string
}

type GetSellerProfileUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    sellerProfile: SellerProfile
  }
>

@Injectable()
export class GetSellerProfileUseCase {
  constructor(
    private sellersRepository: SellersRepository,
    private sellerProfileFactory: SellerProfileFactory,
  ) {}

  async execute({
    sellerId,
  }: GetSellerProfileUseCaseRequest): Promise<GetSellerProfileUseCaseResponse> {
    const seller = await this.sellersRepository.findById(sellerId)

    if (!seller) {
      return left(new ResourceNotFoundError())
    }

    const sellerProfile = await this.sellerProfileFactory.create({
      seller,
    })

    return right({
      sellerProfile,
    })
  }
}
