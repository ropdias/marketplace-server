import { UseCaseError } from '@/core/errors/use-case-error'

export class NotProductOwnerError extends Error implements UseCaseError {
  constructor() {
    super('User is not the owner of the product.')
  }
}
