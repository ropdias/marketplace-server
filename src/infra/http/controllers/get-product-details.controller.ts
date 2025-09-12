import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
} from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import {
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
import { GetProductDetailsUseCase } from '@/domain/marketplace/application/use-cases/get-product-details'

@Controller('/products/:id')
@ApiTags('Products')
export class GetProductDetailsController {
  constructor(private getProductDetails: GetProductDetailsUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a product by its ID' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'The product id (uuid)',
    required: true,
  })
  @ApiOkResponse({
    description: 'The product was successfully found.',
    type: ProductDetailsResponse,
  })
  @ApiNotFoundResponse({
    description: 'The product was not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
  })
  async handle(@Param('id') productId: string) {
    const result = await this.getProductDetails.execute({ productId })

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

    const { productDetails } = result.value

    return ProductDetailsPresenter.toHTTP(productDetails)
  }
}
