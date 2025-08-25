import { FetchAllCategoriesUseCase } from './fetch-all-categories'
import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { makeCategory } from 'test/factories/make-category'

let inMemoryCategoriesRepository: InMemoryCategoriesRepository
let sut: FetchAllCategoriesUseCase

describe('Fetch All Categories', () => {
  beforeEach(() => {
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository()
    sut = new FetchAllCategoriesUseCase(inMemoryCategoriesRepository)
  })

  it('should be able to fetch all categories', async () => {
    const category1 = makeCategory({ title: 'Category 1' })
    const category2 = makeCategory({ title: 'Category 2' })
    const category3 = makeCategory({ title: 'Category 3' })

    await inMemoryCategoriesRepository.create(category1)
    await inMemoryCategoriesRepository.create(category2)
    await inMemoryCategoriesRepository.create(category3)

    const result = await sut.execute()

    expect(result.isRight()).toBe(true)
    expect(result.value?.categories).toHaveLength(3)
    expect(result.value?.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Category 1',
          id: category1.id,
        }),
        expect.objectContaining({
          title: 'Category 2',
          id: category2.id,
        }),
        expect.objectContaining({
          title: 'Category 3',
          id: category3.id,
        }),
      ]),
    )
  })

  it('should return empty array if no categories exist', async () => {
    const result = await sut.execute()

    expect(result.isRight()).toBe(true)
    expect(result.value?.categories).toHaveLength(0)
  })
})
