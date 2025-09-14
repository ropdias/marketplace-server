import { ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { IS_PUBLIC_KEY } from './public.decorator'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super()
  }

  canActivate(context: ExecutionContext) {
    // ✅ getAllAndOverride checks the method first, then the class
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // Checks if the method has @Public()
      context.getClass(), // Checks if the class has @Public()
    ])

    if (isPublic) {
      return true // Allows access without authentication
    }

    return super.canActivate(context)
  }
}
