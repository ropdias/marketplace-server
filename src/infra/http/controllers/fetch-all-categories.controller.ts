import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common'
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger'
import { FetchAllCategoriesUseCase } from '@/domain/marketplace/application/use-cases/fetch-all-categories'
import {
  CategoriesListResponse,
  CategoryPresenter,
} from '../presenters/category-presenter'

@Controller('/categories')
@ApiTags('Categories')
export class FetchAllCategoriesController {
  constructor(private fetchAllCategories: FetchAllCategoriesUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all categories' })
  @ApiOkResponse({
    description: 'All categories were successfully found.',
    type: CategoriesListResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
  })
  async handle() {
    const result = await this.fetchAllCategories.execute()

    if (result.isLeft()) {
      const error = result.value

      if (!error) {
        // Log the unknown error for debugging
        console.error(`Unexpected error in ${this.constructor.name}`, error)
        throw new InternalServerErrorException('An unexpected error occurred')
      }
    }

    const { categories } = result.value

    return CategoryPresenter.toHTTPList(categories)
  }
}
