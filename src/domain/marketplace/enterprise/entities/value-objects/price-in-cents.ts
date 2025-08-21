import { ValueObject } from '@/core/entities/value-object'

interface PriceInCentsProps {
  value: number
}

export class PriceInCents extends ValueObject<PriceInCentsProps> {
  get value() {
    return this.props.value
  }

  private static normalize(value: number): number {
    if (!Number.isFinite(value) || value < 0) {
      return 0
    }

    return Math.floor(value)
  }

  static create(value: number): PriceInCents {
    const normalized = this.normalize(value)
    return new PriceInCents({ value: normalized })
  }

  public equals(other: PriceInCents): boolean {
    return this.value === other.value
  }
}
