import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
} from '@nestjs/common'
import {
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { CountProductViewsFromProductLast7DaysUseCase } from '@/domain/marketplace/application/use-cases/count-product-views-from-product-last-7-days'

class CountProductViewsFromProductLast7DaysResponse {
  @ApiProperty() amount!: number
}

@Controller('/products/:id/metrics/views')
@ApiTags('Metrics')
export class CountProductViewsFromProductLast7DaysController {
  constructor(
    private countProductViewsFromProductLast7Days: CountProductViewsFromProductLast7DaysUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Count the number of views received by a product in the last 7 days.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'The product id (uuid)',
    required: true,
  })
  @ApiOkResponse({
    description: 'The amount of views received by the product in 7 days.',
    type: CountProductViewsFromProductLast7DaysResponse,
  })
  @ApiNotFoundResponse({
    description: 'The seller or product was not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
  })
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('id') productId: string,
  ) {
    const sellerId = user.sub
    const result = await this.countProductViewsFromProductLast7Days.execute({
      sellerId,
      productId,
    })

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

    const { amount } = result.value

    return {
      amount,
    }
  }
}
