import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Post,
  UsePipes,
} from '@nestjs/common'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { z } from 'zod'
import { Public } from '@/infra/auth/public.decorator'
import { CreateSellerUseCase } from '@/domain/marketplace/application/use-cases/create-seller'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { PasswordIsDifferentError } from '@/domain/marketplace/application/use-cases/errors/password-is-different-error'
import { SellerEmailAlreadyExistsError } from '@/domain/marketplace/application/use-cases/errors/seller-email-already-exists-error'
import { SellerPhoneAlreadyExistsError } from '@/domain/marketplace/application/use-cases/errors/seller-phone-already-exists-error'
import {
  SellerProfilePresenter,
  SellerProfileResponse,
} from '../presenters/seller-profile-presenter'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger'

const createSellerBodySchema = z.object({
  name: z.string(),
  phone: z.string(),
  email: z.email(),
  avatarId: z.string().nullable(),
  password: z.string(),
  passwordConfirmation: z.string(),
})

type CreateSellerBodySchema = z.infer<typeof createSellerBodySchema>

class CreateSellerBody implements CreateSellerBodySchema {
  @ApiProperty() name!: string
  @ApiProperty({ description: 'Unique ' }) phone!: string
  @ApiProperty({ description: 'Unique ', format: 'email' }) email!: string
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Created in POST - /attachments',
  })
  avatarId!: string | null
  @ApiProperty() password!: string
  @ApiProperty() passwordConfirmation!: string
}

@Controller('/sellers')
@Public()
@ApiTags('Sellers')
export class CreateSellerController {
  constructor(private createSeller: CreateSellerUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createSellerBodySchema))
  @ApiOperation({ summary: 'Create a new seller' })
  @ApiBody({ type: CreateSellerBody })
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
    type: SellerProfileResponse,
  })
  @ApiBadRequestResponse({ description: 'Password is different.' })
  @ApiNotFoundResponse({ description: 'The avatar was not found.' })
  @ApiConflictResponse({
    description: 'The email or phone already exists.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
  })
  async handle(@Body() body: CreateSellerBodySchema) {
    const result = await this.createSeller.execute(body)

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case PasswordIsDifferentError:
          throw new BadRequestException(error.message)
        case ResourceNotFoundError:
          throw new NotFoundException('The avatar was not found.')
        case SellerEmailAlreadyExistsError:
          throw new ConflictException(error.message)
        case SellerPhoneAlreadyExistsError:
          throw new ConflictException(error.message)
        default:
          // Log the unknown error for debugging
          console.error('Unexpected error in CreateSellerController:', error)
          throw new InternalServerErrorException('An unexpected error occurred')
      }
    }

    const { sellerProfile } = result.value

    return SellerProfilePresenter.toHTTP(sellerProfile)
  }
}
