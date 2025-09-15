import { CategoryDTO } from '@/domain/marketplace/application/dtos/category-dtos'
import { ApiProperty } from '@nestjs/swagger'
import { z } from 'zod'

export const categoryDTOSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  slug: z.string(),
})

export type CategoryDTOResponseType = z.infer<typeof categoryDTOSchema>

export const categoriesListResponseSchema = z.object({
  categories: z.array(categoryDTOSchema),
})

export type CategoriesListResponseType = z.infer<
  typeof categoriesListResponseSchema
>

export class CategoryDTOResponse implements CategoryDTOResponseType {
  @ApiProperty({ format: 'uuid' }) id: string
  @ApiProperty() title: string
  @ApiProperty() slug: string

  constructor(category: CategoryDTO) {
    this.id = category.id
    this.title = category.title
    this.slug = category.slug
  }
}

export class CategoriesListResponse implements CategoriesListResponseType {
  @ApiProperty({ type: [CategoryDTOResponse] })
  categories: CategoryDTOResponse[]

  constructor(dtos: CategoryDTO[]) {
    this.categories = dtos.map((dto) => new CategoryDTOResponse(dto))
  }
}

export class CategoryPresenter {
  static toHTTPMany(dtos: CategoryDTO[]): CategoriesListResponse {
    return new CategoriesListResponse(dtos)
  }
}
