import { ValueObject } from '@/core/entities/value-object'
import { randomUUID } from 'crypto'

export interface SlugProps {
  value: string
}

export class Slug extends ValueObject<SlugProps> {
  get value() {
    return this.props.value
  }

  static create(value: string) {
    return new Slug({ value })
  }

  /**
   *  Receives a string and normalize it as a unique slug.
   *
   * Example: "An example title" => "an-example-title-c4a3ed0e3e7d45f89e2b957d9fbc462b"
   *
   * @param text {string}
   */
  static createFromText(text: string) {
    const slugText = text
      .normalize('NFKD')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // change all white spaces for a empty string
      .replace(/[^\w-]+/g, '') // We will remove everything that is not a word (like symbols)
      .replace(/_/g, '-') // changing all underline for "-"
      .replace(/--+/g, '-') // if we have two "-" replace for only one "-"
      .replace(/-$/g, '') // if in the end we have a "-" we will remove it

    const uuid = randomUUID().replace(/-/g, '') // remove hifens from uuid

    const slugWithUUID = `${slugText}-${uuid}`

    return new Slug({ value: slugWithUUID })
  }
}
