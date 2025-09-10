import { CategoryDTO } from '@/domain/marketplace/application/dtos/category-dtos'

export class CategoryPresenter {
  static toHTTP(category: CategoryDTO) {
    return {
      id: category.id,
      title: category.title,
      slug: category.slug,
    }
  }
}
