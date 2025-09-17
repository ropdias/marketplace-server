import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Query,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger'
import {
  ProductDetailsListResponse,
  ProductDetailsPresenter,
} from '../presenters/product-details-presenter'
import { ZodValidationPipe } from '../pipes/zod-validation.pipe'
import { z } from 'zod'
import { ProductStatusEnum } from '@/domain/marketplace/enterprise/entities/value-objects/product-status'
import { InvalidProductStatusError } from '@/domain/marketplace/application/use-cases/errors/invalid-product-status-error'
import { FetchRecentProductsUseCase } from '@/domain/marketplace/application/use-cases/fetch-recent-products'
import { EnvService } from '@/infra/env/env.service'

const pageQueryParamSchema = z.coerce.number().nonnegative().optional()
const statusQueryParamSchema = z.enum(ProductStatusEnum).optional()
const searchQueryParamSchema = z.string().optional()

const pageQueryValidationPipe = new ZodValidationPipe(pageQueryParamSchema)
const statusQueryValidationPipe = new ZodValidationPipe(statusQueryParamSchema)
const searchQueryValidationPipe = new ZodValidationPipe(searchQueryParamSchema)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>
type StatusQueryParamSchema = z.infer<typeof statusQueryParamSchema>
type SearchQueryParamSchema = z.infer<typeof searchQueryParamSchema>

@Controller('/products')
@ApiTags('Products')
export class FetchRecentProductsController {
  constructor(
    private fetchRecentProducts: FetchRecentProductsUseCase,
    private env: EnvService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all products' })
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
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
  })
  @ApiOkResponse({
    description: 'All products were successfully found.',
    type: ProductDetailsListResponse,
  })
  @ApiBadRequestResponse({
    description: 'The provided product status is invalid.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
  })
  async handle(
    @Query('page', pageQueryValidationPipe) page: PageQueryParamSchema,
    @Query('status', statusQueryValidationPipe) status: StatusQueryParamSchema,
    @Query('search', searchQueryValidationPipe) search: SearchQueryParamSchema,
  ) {
    const result = await this.fetchRecentProducts.execute({
      page,
      status,
      search,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case InvalidProductStatusError:
          throw new BadRequestException(error.message)
        default:
          // Log the unknown error for debugging
          console.error(`Unexpected error in ${this.constructor.name}`, error)
          throw new InternalServerErrorException('An unexpected error occurred')
      }
    }

    const { productDetailsList } = result.value

    return ProductDetailsPresenter.toHTTPMany(
      productDetailsList,
      this.env.get('AWS_BUCKET_NAME'),
      this.env.get('AWS_REGION'),
    )
  }
}
