import { Injectable } from '@nestjs/common'
import type { CookieOptions, Response, Request } from 'express'
import { EnvService } from '@/infra/env/env.service'
import { Request as ExpressRequest } from 'express'

export interface RequestWithCookies extends ExpressRequest {
  cookies: { [key: string]: string }
}

@Injectable()
export class JwtCookieService {
  static readonly ACCESS_TOKEN_COOKIE = 'access_token'

  constructor(private readonly env: EnvService) {}

  private baseOptions(): CookieOptions {
    const isProduction = this.env.get('NODE_ENV') === 'production'

    return {
      httpOnly: true, // Prevents XSS attacks
      secure: isProduction, // HTTPS in production
      sameSite: 'strict', // Prevents CSRF attacks
      path: '/', // Available for entire domain
    }
  }

  signInOptions(): CookieOptions {
    return {
      ...this.baseOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    }
  }

  signOutOptions(): CookieOptions {
    return this.baseOptions()
  }

  // Extracts the JWT from the request
  extractJwtFromCookie() {
    return (req: RequestWithCookies): string | null => {
      const token = req.cookies?.[JwtCookieService.ACCESS_TOKEN_COOKIE]
      return typeof token === 'string' ? token : null
    }
  }

  // Sets the JWT cookie in the response
  setCookie(res: Response, token: string): void {
    res.cookie(
      JwtCookieService.ACCESS_TOKEN_COOKIE,
      token,
      this.signInOptions(),
    )
  }

  // Clears the JWT cookie from the response
  clearCookie(res: Response): void {
    res.clearCookie(JwtCookieService.ACCESS_TOKEN_COOKIE, this.signOutOptions())
  }
}
