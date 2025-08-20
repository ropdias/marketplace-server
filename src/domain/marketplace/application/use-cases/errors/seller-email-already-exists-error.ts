import { UseCaseError } from '@/core/errors/use-case-error'

export class SellerEmailAlreadyExistsError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('The email already exists.')
  }
}
