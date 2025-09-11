import { CategoryMapper } from './category-mapper'
import { makeCategory } from 'test/factories/make-category'

describe('CategoryMapper', () => {
  it('should map category to DTO', () => {
    const category = makeCategory()

    const dto = CategoryMapper.toDTO(category)

    expect(dto).toEqual({
      id: category.id.toString(),
      title: category.title,
      slug: category.slug.value,
    })
  })

  it('should map a category list to a DTO List', () => {
    const categories = [makeCategory(), makeCategory()]

    const dto = CategoryMapper.toDTOList(categories)

    expect(dto).toEqual([
      {
        id: categories[0].id.toString(),
        title: categories[0].title,
        slug: categories[0].slug.value,
      },
      {
        id: categories[1].id.toString(),
        title: categories[1].title,
        slug: categories[1].slug.value,
      },
    ])
  })
})
