import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Res,
} from '@nestjs/common'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { z } from 'zod'
import { Public } from '@/infra/auth/public.decorator'
import { AuthenticateSellerUseCase } from '@/domain/marketplace/application/use-cases/authenticate-seller'
import { WrongCredentialsError } from '@/domain/marketplace/application/use-cases/errors/wrong-credentials-error'
import {
  ApiBody,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger'
import type { Response } from 'express'
import { JwtCookieService } from '@/infra/auth/jwt-cookie.service'

const authenticateBodySchema = z.object({
  email: z.email(),
  password: z.string(),
})

const bodyValidationPipe = new ZodValidationPipe(authenticateBodySchema)

type AuthenticateBodySchema = z.infer<typeof authenticateBodySchema>

class AuthenticateSellerBody implements AuthenticateBodySchema {
  @ApiProperty({ format: 'email' }) email!: string
  @ApiProperty() password!: string
}

class AuthenticateSellerResponse {
  @ApiProperty({
    default: 'Authentication successful. JWT set in httpOnly cookie.',
  })
  message!: string
}

@Controller('/sellers/sessions')
@Public()
@ApiTags('Sessions')
export class AuthenticateSellerController {
  constructor(
    private authenticateSeller: AuthenticateSellerUseCase,
    private jwtCookie: JwtCookieService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate seller',
    description: 'Authenticates seller and sets JWT in httpOnly cookie',
  })
  @ApiBody({ type: AuthenticateSellerBody })
  @ApiOkResponse({
    description: 'Authentication successful. JWT set in httpOnly cookie.',
    type: AuthenticateSellerResponse,
    headers: {
      'Set-Cookie': {
        description: 'JWT token in httpOnly cookie',
        schema: {
          type: 'string',
          example:
            'access_token=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Path=/',
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Invalid credentials.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
  })
  async handle(
    @Body(bodyValidationPipe) body: AuthenticateBodySchema,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authenticateSeller.execute(body)

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case WrongCredentialsError:
          throw new ForbiddenException(error.message)
        default:
          // Log the unknown error for debugging
          console.error(`Unexpected error in ${this.constructor.name}`, error)
          throw new InternalServerErrorException('An unexpected error occurred')
      }
    }

    const { accessToken } = result.value

    this.jwtCookie.setCookie(response, accessToken)

    return {
      message: 'Authentication successful',
    }
  }
}
