import { Slug } from './slug'
import { validate, version } from 'uuid'

describe('Creating Slugs', () => {
  function startsWithAndEndsWithValidUUIDv4(
    slug: string,
    fixedPart: string,
  ): boolean {
    // Find the last hyphen
    const lastHyphenIndex = slug.lastIndexOf('-')

    // Check if no hyphen is found
    if (lastHyphenIndex === -1) {
      return false
    }

    // Split the slug into fixedPart and uuidPart
    const fixedPartFromSlug = slug.substring(0, lastHyphenIndex)
    const uuidPart = slug.substring(lastHyphenIndex + 1)

    // Check if the first part matches the fixed part
    if (fixedPartFromSlug !== fixedPart) {
      return false
    }

    const uuidPart1 = uuidPart.substring(0, 8)
    const uuidPart2 = uuidPart.substring(8, 12)
    const uuidPart3 = uuidPart.substring(12, 16)
    const uuidPart4 = uuidPart.substring(16, 20)
    const uuidPart5 = uuidPart.substring(20)

    // Validate the UUID part (add hifens to uuidPart to make it valid)
    const formattedUUID = `${uuidPart1}-${uuidPart2}-${uuidPart3}-${uuidPart4}-${uuidPart5}`

    return validate(formattedUUID) && version(formattedUUID) === 4
  }

  it('should create a slug from text with correct fixed part and UUID', () => {
    const slug = Slug.createFromText('example-question-title')
    const isValid = startsWithAndEndsWithValidUUIDv4(
      slug.value,
      'example-question-title',
    )
    expect(isValid).toBe(true)
  })

  it('should create a slug from text with empty text', () => {
    const slug = Slug.createFromText('')
    const isValid = startsWithAndEndsWithValidUUIDv4(slug.value, '')
    expect(isValid).toBe(true)
  })

  it('should not validate a slug created from text with incorrect fixed part', () => {
    const slug = Slug.createFromText('example-question-title')
    const isValid = startsWithAndEndsWithValidUUIDv4(
      slug.value,
      'wrong-fixed-part',
    )
    expect(isValid).toBe(false)
  })

  it('should create a slug with a valid uuid using create()', () => {
    const slug = Slug.create(
      'example-question-title-3285b6a33c3f45eea681f2f05679b291',
    )

    expect(slug.value).toEqual(
      'example-question-title-3285b6a33c3f45eea681f2f05679b291',
    )
  })

  it('should create a slug without a valid uuid using create()', () => {
    const slug = Slug.create('example-question-title')

    expect(slug.value).toEqual('example-question-title')
  })

  it('should be a valid unique slug if created using create() with a valid uuid v4', () => {
    const slug = Slug.create(
      'example-question-title-3285b6a33c3f45eea681f2f05679b291',
    )

    const isValid = startsWithAndEndsWithValidUUIDv4(
      slug.value,
      'example-question-title',
    )
    expect(isValid).toBe(true)
  })

  it('should be a valid unique slug if created using create() without a text', () => {
    const slug = Slug.create('-3285b6a33c3f45eea681f2f05679b291')

    const isValid = startsWithAndEndsWithValidUUIDv4(slug.value, '')
    expect(isValid).toBe(true)
  })

  it('should be a invalid unique slug if created using create() without a uuid', () => {
    const slug = Slug.create('example-question-title')

    const isValid = startsWithAndEndsWithValidUUIDv4(
      slug.value,
      'example-question-title',
    )
    expect(isValid).toBe(false)
  })

  it('should be a invalid unique slug if created using create() with a uuid with a version other than 4', () => {
    // creating a slug with a uuid version 1
    const slug = Slug.create(
      'example-question-title-53b1b7b0e11711ec82370242ac130003',
    )

    const isValid = startsWithAndEndsWithValidUUIDv4(
      slug.value,
      'example-question-title',
    )
    expect(isValid).toBe(false)
  })

  it('should be a invalid unique slug if created using create() with a - in the end', () => {
    const slug = Slug.create(
      'example-question-title-3285b6a33c3f45eea681f2f05679b291-',
    )

    const isValid = startsWithAndEndsWithValidUUIDv4(
      slug.value,
      'example-question-title',
    )
    expect(isValid).toBe(false)
  })

  it('should be able to create unique slugs', () => {
    const text = 'Example question title'
    const slugs = new Set<string>() // We'll use a set to store unique slugs

    // Generate several slugs and store them in the set
    for (let i = 0; i < 10; i++) {
      const slug = Slug.createFromText(text)
      slugs.add(slug.value)
    }

    // Ensure all slugs in the set are unique
    expect(slugs.size).toBe(10) // We should have 10 unique slugs
  })
})
