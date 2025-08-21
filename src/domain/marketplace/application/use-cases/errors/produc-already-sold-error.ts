import { UseCaseError } from '@/core/errors/use-case-error'

export class ProductAlreadySoldError extends Error implements UseCaseError {
  constructor() {
    super('Product is already sold.')
  }
}
