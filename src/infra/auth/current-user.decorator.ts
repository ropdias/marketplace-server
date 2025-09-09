import {
  ExecutionContext,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common'
import { Request } from 'express'
import { UserPayload } from './jwt.strategy'

interface RequestWithUser extends Request {
  user?: UserPayload
}

export const CurrentUser = createParamDecorator(
  (_: never, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<RequestWithUser>()

    // request.user is populated by the Passport strategy's validate() method
    // when authentication is processed by the active authentication guard.
    // In public routes (marked with @Public()), authentication guards bypass processing entirely,
    // so no strategy is executed and request.user remains undefined.
    // This decorator should only be used in protected routes where authentication is required.
    if (!request.user) {
      throw new UnauthorizedException('No user found in request')
    }

    return request.user
  },
)
