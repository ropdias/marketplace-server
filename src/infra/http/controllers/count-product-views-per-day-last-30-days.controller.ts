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
import { CountProductViewsPerDayLast30DaysUseCase } from '@/domain/marketplace/application/use-cases/count-product-views-per-day-last-30-days'

class ViewsPerDayItem {
  @ApiProperty({
    type: 'string',
    format: 'date-time',
  })
  date!: Date

  @ApiProperty({
    type: 'number',
  })
  amount!: number
}

class CountProductViewsPerDayLast30DaysResponse {
  @ApiProperty({ type: [ViewsPerDayItem] })
  viewsPerDay!: ViewsPerDayItem[]
}

@Controller('/sellers/metrics/views/days')
@ApiTags('Metrics')
export class CountProductViewsPerDayLast30DaysController {
  constructor(
    private countProductViewsPerDayLast30Days: CountProductViewsPerDayLast30DaysUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Count the number of views per day received by the seller in 30 days.',
  })
  @ApiOkResponse({
    description:
      'The amount of views per day received by the seller in 30 days.',
    type: CountProductViewsPerDayLast30DaysResponse,
  })
  @ApiNotFoundResponse({
    description: 'Seller not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
  })
  async handle(@CurrentUser() user: UserPayload) {
    const sellerId = user.sub
    const result = await this.countProductViewsPerDayLast30Days.execute({
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

    const { viewsPerDay } = result.value

    return {
      viewsPerDay,
    }
  }
}
