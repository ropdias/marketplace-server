import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Query,
} from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger'
import {
  ProductDetailsListResponse,
  ProductDetailsPresenter,
} from '../presenters/product-details-presenter'
import { FetchAllProductsFromSellerUseCase } from '@/domain/marketplace/application/use-cases/fetch-all-products-from-seller'
import { ZodValidationPipe } from '../pipes/zod-validation.pipe'
import { z } from 'zod'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { ProductStatusEnum } from '@/domain/marketplace/enterprise/entities/value-objects/product-status'
import { InvalidProductStatusError } from '@/domain/marketplace/application/use-cases/errors/invalid-product-status-error'

const statusQueryParamSchema = z.enum(ProductStatusEnum).optional()
const searchQueryParamSchema = z.string().optional()

const statusQueryValidationPipe = new ZodValidationPipe(statusQueryParamSchema)
const searchQueryValidationPipe = new ZodValidationPipe(searchQueryParamSchema)

type StatusQueryParamSchema = z.infer<typeof statusQueryParamSchema>
type SearchQueryParamSchema = z.infer<typeof searchQueryParamSchema>

@Controller('/products/me')
@ApiTags('Products')
export class FetchAllProductsFromSellerController {
  constructor(
    private fetchAllProductsFromSeller: FetchAllProductsFromSellerUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all products from the seller' })
  @ApiQuery({
    name: 'status',
    type: String,
    enum: ProductStatusEnum,
    required: false,
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false,
  })
  @ApiOkResponse({
    description: 'All products were successfully found.',
    type: ProductDetailsListResponse,
  })
  @ApiBadRequestResponse({
    description: 'The provided product status is invalid.',
  })
  @ApiNotFoundResponse({
    description: 'The seller was not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
  })
  async handle(
    @Query('status', statusQueryValidationPipe) status: StatusQueryParamSchema,
    @Query('search', searchQueryValidationPipe) search: SearchQueryParamSchema,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.fetchAllProductsFromSeller.execute({
      sellerId: user.sub,
      status,
      search,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case InvalidProductStatusError:
          throw new BadRequestException(error.message)
        default:
          // Log the unknown error for debugging
          console.error(`Unexpected error in ${this.constructor.name}`, error)
          throw new InternalServerErrorException('An unexpected error occurred')
      }
    }

    const { productDetailsList } = result.value

    return ProductDetailsPresenter.toHTTPMany(productDetailsList)
  }
}
