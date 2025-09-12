import { CategoryDTO } from '@/domain/marketplace/application/dtos/category-dtos'
import { ApiProperty } from '@nestjs/swagger'

export class CategoryDTOResponse {
  @ApiProperty({ format: 'uuid' }) id: string
  @ApiProperty() title: string
  @ApiProperty() slug: string

  constructor(category: CategoryDTO) {
    this.id = category.id
    this.title = category.title
    this.slug = category.slug
  }
}

export class CategoriesResponse {
  @ApiProperty({ type: [CategoryDTOResponse] })
  categories: CategoryDTOResponse[]

  constructor(dtos: CategoryDTO[]) {
    this.categories = dtos.map((dto) => new CategoryDTOResponse(dto))
  }
}

export class CategoryPresenter {
  static toHTTPList(dtos: CategoryDTO[]): CategoriesResponse {
    return new CategoriesResponse(dtos)
  }
}
