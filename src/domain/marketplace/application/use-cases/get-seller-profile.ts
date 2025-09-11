import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { SellersRepository } from '../repositories/sellers-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { SellerProfileDTO } from '../dtos/seller-profile-dtos'
import { SellerProfileMapper } from '../mappers/seller-profile-mapper'
import { SellerProfileAssembler } from '../assemblers/seller-profile-assembler'

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
    private sellerProfileAssembler: SellerProfileAssembler,
  ) {}

  async execute({
    sellerId,
  }: GetSellerProfileUseCaseRequest): Promise<GetSellerProfileUseCaseResponse> {
    const seller = await this.sellersRepository.findById(sellerId)

    if (!seller) {
      return left(new ResourceNotFoundError())
    }

    const sellerProfileEither = await this.sellerProfileAssembler.assemble({
      seller: seller,
    })
    if (sellerProfileEither.isLeft()) return left(sellerProfileEither.value)

    const sellerProfileDTO = SellerProfileMapper.toDTO(
      sellerProfileEither.value,
    )

    return right({
      sellerProfile: sellerProfileDTO,
    })
  }
}
