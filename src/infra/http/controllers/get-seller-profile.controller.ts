import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import {
  SellerProfilePresenter,
  SellerProfileResponse,
} from '../presenters/seller-profile-presenter'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { GetSellerProfileUseCase } from '@/domain/marketplace/application/use-cases/get-seller-profile'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger'

@Controller('/sellers/me')
@ApiBearerAuth()
@ApiTags('Sellers')
export class GetSellerProfileController {
  constructor(private getSellerProfile: GetSellerProfileUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the seller profile' })
  @ApiOkResponse({
    description: 'The seller profile was successfully found',
    type: SellerProfileResponse,
  })
  async handle(@CurrentUser() user: UserPayload) {
    const sellerId = user.sub

    const result = await this.getSellerProfile.execute({ sellerId })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    const { sellerProfile } = result.value

    return SellerProfilePresenter.toHTTP(sellerProfile)
  }
}
