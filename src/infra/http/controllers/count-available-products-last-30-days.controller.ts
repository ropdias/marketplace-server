import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import {
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger'
import { CountAvailableProductsLast30DaysUseCase } from '@/domain/marketplace/application/use-cases/count-available-products-last-30-days'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

class CountAvailableProductsLast30DaysResponse {
  @ApiProperty() amount!: number
}

@Controller('/sellers/metrics/products/available')
@ApiTags('Metrics')
export class CountAvailableProductsLast30DaysController {
  constructor(
    private countAvailableProductsLast30Days: CountAvailableProductsLast30DaysUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Count the amount of available products in 30 days.',
  })
  @ApiOkResponse({
    description: 'The amount of available products in 30 days.',
    type: CountAvailableProductsLast30DaysResponse,
  })
  @ApiNotFoundResponse({
    description: 'Seller not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
  })
  async handle(@CurrentUser() user: UserPayload) {
    const sellerId = user.sub
    const result = await this.countAvailableProductsLast30Days.execute({
      sellerId,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        default:
          // Log the unknown error for debugging
          console.error('Unexpected error in CreateSellerController:', error)
          throw new InternalServerErrorException('An unexpected error occurred')
      }
    }

    const { amount } = result.value

    return {
      amount,
    }
  }
}
