import { UseCaseError } from '@/core/errors/use-case-error'

export class NewPasswordMustBeDifferentError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('The newPassword must be different.')
  }
}
