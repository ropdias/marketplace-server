import { Category } from '../../enterprise/entities/category'

export abstract class CategoriesRepository {
  abstract findById(id: string): Promise<Category | null>
  abstract findAll(): Promise<Category[]>
  abstract create(category: Category): Promise<void>
}
