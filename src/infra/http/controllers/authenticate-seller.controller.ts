import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  UsePipes,
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

const authenticateBodySchema = z.object({
  email: z.email(),
  password: z.string(),
})

type AuthenticateBodySchema = z.infer<typeof authenticateBodySchema>

class AuthenticateSellerBody implements AuthenticateBodySchema {
  @ApiProperty({ format: 'email' }) email!: string
  @ApiProperty() password!: string
}

class AuthenticateSellerResponse {
  @ApiProperty() accessToken!: string
}

@Controller('/sellers/sessions')
@Public()
@ApiTags('Sessions')
export class AuthenticateSellerController {
  constructor(private authenticateSeller: AuthenticateSellerUseCase) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(authenticateBodySchema))
  @ApiOperation({ summary: 'Get the seller access token​' })
  @ApiBody({ type: AuthenticateSellerBody })
  @ApiOkResponse({
    description: 'The seller access token.',
    type: AuthenticateSellerResponse,
  })
  @ApiForbiddenResponse({
    description: 'Invalid credentials.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
  })
  async handle(@Body() body: AuthenticateBodySchema) {
    const result = await this.authenticateSeller.execute(body)

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case WrongCredentialsError:
          throw new ForbiddenException(error.message)
        default:
          // Log the unknown error for debugging
          console.error('Unexpected error in CreateSellerController:', error)
          throw new InternalServerErrorException('An unexpected error occurred')
      }
    }

    const { accessToken } = result.value

    return {
      accessToken,
    }
  }
}
