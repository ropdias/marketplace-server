import { UseCaseError } from '@/core/errors/use-case-error'

export class ProductHasAlreadyBeenSoldError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Product has already been sold.')
  }
}
