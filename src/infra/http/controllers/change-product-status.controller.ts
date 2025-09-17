import {
  BadRequestException,
  ConflictException,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger'
import {
  ProductDetailsPresenter,
  ProductDetailsResponse,
} from '../presenters/product-details-presenter'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { ProductStatusEnum } from '@/domain/marketplace/enterprise/entities/value-objects/product-status'
import { InvalidProductStatusError } from '@/domain/marketplace/application/use-cases/errors/invalid-product-status-error'
import { ChangeProductStatusUseCase } from '@/domain/marketplace/application/use-cases/change-product-status'
import { NotProductOwnerError } from '@/domain/marketplace/application/use-cases/errors/not-product-owner-error'
import { ProductWithSameStatusError } from '@/domain/marketplace/application/use-cases/errors/product-with-same-status-error'
import { ProductHasAlreadyBeenSoldError } from '@/domain/marketplace/application/use-cases/errors/product-has-already-been-sold-error'
import { ProductHasAlreadyBeenCancelledError } from '@/domain/marketplace/application/use-cases/errors/product-has-already-been-cancelled-error'
import { EnvService } from '@/infra/env/env.service'

@Controller('/products/:id/:status')
@ApiTags('Products')
export class ChangeProductStatusController {
  constructor(
    private changeProductStatus: ChangeProductStatusUseCase,
    private env: EnvService,
  ) {}

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change the product status' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'The product id (uuid)',
    required: true,
  })
  @ApiParam({
    name: 'status',
    type: String,
    enum: ProductStatusEnum,
    required: true,
  })
  @ApiOkResponse({
    description: 'The product status was successfully changed.',
    type: ProductDetailsResponse,
  })
  @ApiBadRequestResponse({
    description: 'The provided product status is invalid.',
  })
  @ApiForbiddenResponse({
    description:
      'The product does not belong to the seller or the product is with the same status.',
  })
  @ApiNotFoundResponse({
    description: 'The product or seller were not found.',
  })
  @ApiConflictResponse({
    description:
      'The product has already been sold or the product has already been cancelled.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
  })
  async handle(
    @Param('id') productId: string,
    @Param('status') status: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.changeProductStatus.execute({
      status,
      productId,
      sellerId: user.sub,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case NotProductOwnerError:
          throw new ForbiddenException(error.message)
        case InvalidProductStatusError:
          throw new BadRequestException(error.message)
        case ProductWithSameStatusError:
          throw new ForbiddenException(error.message)
        case ProductHasAlreadyBeenSoldError:
          throw new ConflictException(error.message)
        case ProductHasAlreadyBeenCancelledError:
          throw new ConflictException(error.message)
        default:
          // Log the unknown error for debugging
          console.error(`Unexpected error in ${this.constructor.name}`, error)
          throw new InternalServerErrorException('An unexpected error occurred')
      }
    }

    const { productDetails } = result.value

    return ProductDetailsPresenter.toHTTP(
      productDetails,
      this.env.get('AWS_BUCKET_NAME'),
      this.env.get('AWS_REGION'),
    )
  }
}
