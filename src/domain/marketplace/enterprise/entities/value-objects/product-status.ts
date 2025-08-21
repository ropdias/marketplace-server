import { ValueObject } from '@/core/entities/value-object'

export enum ProductStatusEnum {
  AVAILABLE = 'available',
  CANCELLED = 'cancelled',
  SOLD = 'sold',
}

interface ProductStatusProps {
  value: ProductStatusEnum
}

export class ProductStatus extends ValueObject<ProductStatusProps> {
  get value() {
    return this.props.value
  }

  static create(value: ProductStatusEnum) {
    return new ProductStatus({ value })
  }

  public equals(other: ProductStatus): boolean {
    return this.props.value === other.props.value
  }
}
