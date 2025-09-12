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
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { CountProductViewsLast30DaysUseCase } from '@/domain/marketplace/application/use-cases/count-product-views-last-30-days'

class CountProductViewsLast30DaysResponse {
  @ApiProperty() amount!: number
}

@Controller('/sellers/metrics/views')
@ApiTags('Metrics')
export class CountProductViewsLast30DaysController {
  constructor(
    private countProductViewsLast30Days: CountProductViewsLast30DaysUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Count the number of views received by the seller in 30 days.',
  })
  @ApiOkResponse({
    description: 'The amount of views received by the seller in 30 days.',
    type: CountProductViewsLast30DaysResponse,
  })
  @ApiNotFoundResponse({
    description: 'The seller was not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
  })
  async handle(@CurrentUser() user: UserPayload) {
    const sellerId = user.sub
    const result = await this.countProductViewsLast30Days.execute({
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
