import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { SellersRepository } from '../repositories/sellers-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { SellerProfileFactory } from '../factories/seller-profile-factory'
import { SellerProfileDTO } from '../dtos/seller-profile-dtos'
import { SellerProfileMapper } from '../mappers/seller-profile-mapper'

interface GetSellerProfileUseCaseRequest {
  sellerId: string
}

type GetSellerProfileUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    sellerProfile: SellerProfileDTO
  }
>

@Injectable()
export class GetSellerProfileUseCase {
  constructor(
    private sellersRepository: SellersRepository,
    private sellerProfileFactory: SellerProfileFactory,
    private sellerProfileMapper: SellerProfileMapper,
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

    const sellerProfileDTO = this.sellerProfileMapper.toDTO(sellerProfile)

    return right({
      sellerProfile: sellerProfileDTO,
    })
  }
}
