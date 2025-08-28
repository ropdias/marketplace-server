import { Injectable } from '@nestjs/common'
import { AttachmentsRepository } from '../repositories/attachments-repository'
import { Seller } from '../../enterprise/entities/seller'
import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { SellerProfile } from '../../enterprise/entities/value-objects/seller-profile'
import { Attachment } from '../../enterprise/entities/attachment'
import { SellerProfileFactory } from '../factories/seller-profile-factory'

interface SellerProfileAssemblerRequest {
  seller: Seller
}

type SellerProfileAssemblerResponse = Either<
  ResourceNotFoundError,
  SellerProfile
>

@Injectable()
export class SellerProfileAssembler {
  constructor(
    private attachmentsRepository: AttachmentsRepository,
    private sellerProfileFactory: SellerProfileFactory,
  ) {}

  async assemble({
    seller,
  }: SellerProfileAssemblerRequest): Promise<SellerProfileAssemblerResponse> {
    let avatar: Attachment | null = null

    if (seller.avatarId) {
      avatar = await this.attachmentsRepository.findById(
        seller.avatarId.toString(),
      )
      if (!avatar) {
        return left(new ResourceNotFoundError())
      }
    }

    const sellerProfile = this.sellerProfileFactory.create({
      seller,
      avatar,
    })

    return right(sellerProfile)
  }
}
