import {
  ConflictException,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { RegisterProductViewUseCase } from '@/domain/marketplace/application/use-cases/register-product-view'
import { ViewerIsProductOwnerError } from '@/domain/marketplace/application/use-cases/errors/viewer-is-product-owner-error'
import { ProductViewAlreadyExistsError } from '@/domain/marketplace/application/use-cases/errors/product-view-already-exists-error'
import {
  ProductViewPresenter,
  ProductViewResponse,
} from '../presenters/product-view-presenter'

@Controller('/products/:id/views')
@ApiTags('Viewers')
export class RegisterProductViewController {
  constructor(private registerProductView: RegisterProductViewUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a view on a product' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'The product id (uuid)',
    required: true,
  })
  @ApiCreatedResponse({
    description: 'The view was successfully registered.',
    type: ProductViewResponse,
  })
  @ApiForbiddenResponse({
    description: 'The viewer is the owner of the product.',
  })
  @ApiNotFoundResponse({
    description: 'The product or viewer was not found.',
  })
  @ApiConflictResponse({
    description: 'The product view already exists.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
  })
  async handle(
    @Param('id') productId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.registerProductView.execute({
      productId,
      viewerId: user.sub,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case ViewerIsProductOwnerError:
          throw new ForbiddenException(error.message)
        case ProductViewAlreadyExistsError:
          throw new ConflictException(error.message)
        default:
          // Log the unknown error for debugging
          console.error(`Unexpected error in ${this.constructor.name}`, error)
          throw new InternalServerErrorException('An unexpected error occurred')
      }
    }

    const { productDetails, viewerProfile } = result.value

    return ProductViewPresenter.toHTTP({ productDetails, viewerProfile })
  }
}
