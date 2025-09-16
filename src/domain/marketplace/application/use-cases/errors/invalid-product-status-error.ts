import { UseCaseError } from '@/core/errors/use-case-error'

export class InvalidProductStatusError extends Error implements UseCaseError {
  constructor(status: string) {
    super(`Invalid Product status: ${status}.`)
  }
}
