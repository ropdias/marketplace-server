import { UseCaseError } from '@/core/errors/use-case-error'

export class SellerAlreadyExistsError extends Error implements UseCaseError {
  constructor() {
    super('The email or phone already exists.')
  }
}
