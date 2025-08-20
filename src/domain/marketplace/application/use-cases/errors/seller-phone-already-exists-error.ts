import { UseCaseError } from '@/core/errors/use-case-error'

export class SellerPhoneAlreadyExistsError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('The phone already exists.')
  }
}
