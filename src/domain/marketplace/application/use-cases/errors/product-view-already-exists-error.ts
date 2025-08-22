import { UseCaseError } from '@/core/errors/use-case-error'

export class ProductViewAlreadyExistsError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('The product view already exists.')
  }
}
