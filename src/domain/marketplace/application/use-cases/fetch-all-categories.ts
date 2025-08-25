import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { CategoriesRepository } from '../repositories/categories-repository'
import { CategoryDTO } from '../dtos/category-dtos'
import { CategoryMapper } from '../mappers/category-mapper'

type FetchAllCategoriesUseCaseResponse = Either<
  null,
  { categories: CategoryDTO[] }
>

@Injectable()
export class FetchAllCategoriesUseCase {
  constructor(
    private categoriesRepository: CategoriesRepository,
    private categoryMapper: CategoryMapper,
  ) {}

  async execute(): Promise<FetchAllCategoriesUseCaseResponse> {
    const categories = await this.categoriesRepository.findAll()

    const categoriesDTO = this.categoryMapper.toDTOList(categories)

    return right({ categories: categoriesDTO })
  }
}
