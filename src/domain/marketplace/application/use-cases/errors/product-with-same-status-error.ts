import { UseCaseError } from '@/core/errors/use-case-error'

export class ProductWithSameStatusError extends Error implements UseCaseError {
  constructor() {
    super('Product status is already the same.')
  }
}
