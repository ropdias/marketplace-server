import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { SellersRepository } from '../repositories/sellers-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
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
  constructor(private sellersRepository: SellersRepository) {}

  async execute({
    sellerId,
  }: GetSellerProfileUseCaseRequest): Promise<GetSellerProfileUseCaseResponse> {
    const sellerProfile =
      await this.sellersRepository.findSellerProfileById(sellerId)

    if (!sellerProfile) {
      return left(new ResourceNotFoundError('Seller not found.'))
    }

    const sellerProfileDTO = SellerProfileMapper.toDTO(sellerProfile)

    return right({
      sellerProfile: sellerProfileDTO,
    })
  }
}
