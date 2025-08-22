import { UseCaseError } from '@/core/errors/use-case-error'

export class ViewerIsProductOwnerError extends Error implements UseCaseError {
  constructor() {
    super('The viewer is the owner of the product.')
  }
}
