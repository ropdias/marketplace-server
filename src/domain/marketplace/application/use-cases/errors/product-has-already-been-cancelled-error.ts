import { UseCaseError } from '@/core/errors/use-case-error'

export class ProductHasAlreadyBeenCancelledError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Product has already been cancelled.')
  }
}
