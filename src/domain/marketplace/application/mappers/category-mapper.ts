import { Category } from '../../enterprise/entities/category'
import { CategoryDTO } from '../dtos/category-dtos'

export class CategoryMapper {
  static toDTO(category: Category): CategoryDTO {
    return {
      id: category.id.toString(),
      title: category.title,
      slug: category.slug.value,
    }
  }

  static toDTOList(categories: Category[]): CategoryDTO[] {
    return categories.map((category) => this.toDTO(category))
  }
}
