import { Injectable } from '@nestjs/common'
import { Category } from '../../enterprise/entities/category'
import { CategoryDTO } from '../dtos/category-dtos'

@Injectable()
export class CategoryMapper {
  public toDTOList(categories: Category[]): CategoryDTO[] {
    return categories.map((category) => ({
      id: category.id.toString(),
      title: category.title,
      slug: category.slug.value,
    }))
  }
}
