import { JwtCookieService } from '@/infra/auth/jwt-cookie.service'
import { Public } from '@/infra/auth/public.decorator'
import { Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common'
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger'
import type { Response } from 'express'

class SignOutSellerResponse {
  @ApiProperty({
    default: 'The user was successfully signed out.',
  })
  message!: string
}

@Controller('/sign-out')
@Public()
@ApiTags('Sessions')
export class SignOutSellerController {
  constructor(private jwtCookie: JwtCookieService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign out​',
    description: 'Clears the JWT cookie and logs out the seller',
  })
  @ApiOkResponse({
    description: 'The user was successfully signed out.',
    type: SignOutSellerResponse,
  })
  handle(@Res({ passthrough: true }) response: Response) {
    this.jwtCookie.clearCookie(response)

    return {
      message: 'The user was successfully signed out.',
    }
  }
}
