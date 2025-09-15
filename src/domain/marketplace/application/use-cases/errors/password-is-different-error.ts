import { UseCaseError } from '@/core/errors/use-case-error'

export class PasswordIsDifferentError extends Error implements UseCaseError {
  constructor() {
    super('Password is different.')
  }
}
