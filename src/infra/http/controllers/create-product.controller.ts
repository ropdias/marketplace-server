import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Post,
  UsePipes,
} from '@nestjs/common'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { z } from 'zod'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import {
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger'
import { CreateProductUseCase } from '@/domain/marketplace/application/use-cases/create-product'
import {
  ProductDetailsPresenter,
  ProductDetailsResponse,
} from '../presenters/product-details-presenter'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'

const createProductBodySchema = z.object({
  title: z.string(),
  categoryId: z.uuid(),
  description: z.string(),
  priceInCents: z.coerce.number().nonnegative(),
  attachmentsIds: z.array(z.uuid()),
})

type CreateProductBodySchema = z.infer<typeof createProductBodySchema>

class CreateProductBody implements CreateProductBodySchema {
  @ApiProperty() title!: string
  @ApiProperty({ format: 'uuid' }) categoryId!: string
  @ApiProperty() description!: string
  @ApiProperty() priceInCents!: number
  @ApiProperty({ type: [String] }) attachmentsIds!: string[]
}

@Controller('/products')
@ApiTags('Products')
export class CreateProductController {
  constructor(private createProduct: CreateProductUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createProductBodySchema))
  @ApiOperation({ summary: 'Create a product to sell' })
  @ApiBody({ type: CreateProductBody })
  @ApiCreatedResponse({
    description: 'The product was successfully created.',
    type: ProductDetailsResponse,
  })
  @ApiNotFoundResponse({
    description: 'The seller, category or attachments were not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
  })
  async handle(
    @Body() body: CreateProductBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.createProduct.execute({
      sellerId: user.sub,
      ...body,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(
            'The seller, category or attachments were not found.',
          )
        default:
          // Log the unknown error for debugging
          console.error(`Unexpected error in ${this.constructor.name}`, error)
          throw new InternalServerErrorException('An unexpected error occurred')
      }
    }

    const { productDetails } = result.value

    return ProductDetailsPresenter.toHTTP(productDetails)
  }
}
