import { UseCaseError } from '@/core/errors/use-case-error'

export class InvalidProductStatusError extends Error implements UseCaseError {
  constructor() {
    super('The provided product status is invalid.')
  }
}
