import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Category } from '../../enterprise/entities/category'
import { CategoriesRepository } from '../repositories/categories-repository'

type FetchAllCategoriesUseCaseResponse = Either<
  null,
  {
    categories: Category[]
  }
>

@Injectable()
export class FetchAllCategoriesUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute(): Promise<FetchAllCategoriesUseCaseResponse> {
    const categories = await this.categoriesRepository.findAll()

    return right({
      categories,
    })
  }
}
