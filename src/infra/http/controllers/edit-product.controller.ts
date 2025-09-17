import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Put,
} from '@nestjs/common'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { z } from 'zod'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import {
  ApiBody,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger'
import {
  ProductDetailsPresenter,
  ProductDetailsResponse,
} from '../presenters/product-details-presenter'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { EditProductUseCase } from '@/domain/marketplace/application/use-cases/edit-product'
import { NotProductOwnerError } from '@/domain/marketplace/application/use-cases/errors/not-product-owner-error'
import { ProductHasAlreadyBeenSoldError } from '@/domain/marketplace/application/use-cases/errors/product-has-already-been-sold-error'
import { EnvService } from '@/infra/env/env.service'

const editProductBodySchema = z.object({
  title: z.string(),
  categoryId: z.uuid(),
  description: z.string(),
  priceInCents: z.coerce.number().nonnegative(),
  attachmentsIds: z.array(z.uuid()),
})

const bodyValidationPipe = new ZodValidationPipe(editProductBodySchema)

type EditProductBodySchema = z.infer<typeof editProductBodySchema>

class EditProductBody implements EditProductBodySchema {
  @ApiProperty() title!: string
  @ApiProperty({ format: 'uuid' }) categoryId!: string
  @ApiProperty() description!: string
  @ApiProperty() priceInCents!: number
  @ApiProperty({ type: [String] }) attachmentsIds!: string[]
}

@Controller('/products/:id')
@ApiTags('Products')
export class EditProductController {
  constructor(
    private editProduct: EditProductUseCase,
    private env: EnvService,
  ) {}

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Edit a product' })
  @ApiBody({ type: EditProductBody })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'The product id (uuid)',
    required: true,
  })
  @ApiOkResponse({
    description: 'The product was successfully edited.',
    type: ProductDetailsResponse,
  })
  @ApiForbiddenResponse({
    description:
      'You are not the owner of this product or the product is sold.',
  })
  @ApiNotFoundResponse({
    description: 'The seller, category, attachments or product were not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
  })
  async handle(
    @Body(bodyValidationPipe) body: EditProductBodySchema,
    @Param('id') productId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.editProduct.execute({
      productId,
      ...body,
      sellerId: user.sub,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case NotProductOwnerError:
          throw new ForbiddenException(error.message)
        case ProductHasAlreadyBeenSoldError:
          throw new ForbiddenException(error.message)
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
