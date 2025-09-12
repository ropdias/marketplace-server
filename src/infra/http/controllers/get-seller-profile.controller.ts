import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
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
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
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
  @ApiNotFoundResponse({
    description: 'Seller profile not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
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
          // Log the unknown error for debugging
          console.error(`Unexpected error in ${this.constructor.name}`, error)
          throw new InternalServerErrorException('An unexpected error occurred')
      }
    }

    const { sellerProfile } = result.value

    return SellerProfilePresenter.toHTTP(sellerProfile)
  }
}
