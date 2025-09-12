import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Put,
} from '@nestjs/common'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { z } from 'zod'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { EditSellerUseCase } from '@/domain/marketplace/application/use-cases/edit-seller'
import {
  SellerProfilePresenter,
  SellerProfileResponse,
} from '../presenters/seller-profile-presenter'
import { WrongCredentialsError } from '@/domain/marketplace/application/use-cases/errors/wrong-credentials-error'
import { NewPasswordMustBeDifferentError } from '@/domain/marketplace/application/use-cases/errors/new-password-must-be-different-error'
import { SellerEmailAlreadyExistsError } from '@/domain/marketplace/application/use-cases/errors/seller-email-already-exists-error'
import { SellerPhoneAlreadyExistsError } from '@/domain/marketplace/application/use-cases/errors/seller-phone-already-exists-error'

const editSellerBodySchema = z.object({
  name: z.string(),
  phone: z.string(),
  email: z.email(),
  avatarId: z.string().optional().nullable(),
  password: z.string().optional(),
  newPassword: z.string().optional(),
})

const bodyValidationPipe = new ZodValidationPipe(editSellerBodySchema)

type EditSellerBodySchema = z.infer<typeof editSellerBodySchema>

class EditSellerBody implements EditSellerBodySchema {
  @ApiProperty() name!: string
  @ApiProperty({ description: 'Unique ' }) phone!: string
  @ApiProperty({ description: 'Unique ', format: 'email' }) email!: string
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Created in POST - /attachments',
  })
  avatarId!: string | null
  @ApiPropertyOptional({
    description: 'The `password` is required when `newPassword` is present',
  })
  password!: string
  @ApiPropertyOptional() newPassword!: string
}

@Controller('/sellers')
@ApiTags('Sellers')
export class EditSellerController {
  constructor(private editSeller: EditSellerUseCase) {}

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update the current seller' })
  @ApiBody({
    type: EditSellerBody,
    examples: {
      default: {
        summary: 'Update basic seller info',
        value: {
          name: 'John Doe',
          phone: '+5511999999999',
          email: 'john@example.com',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'The record has been successfully updated.',
    type: SellerProfileResponse,
  })
  @ApiBadRequestResponse({
    description: 'The newPassword must be different.',
  })
  @ApiForbiddenResponse({
    description: 'Invalid credentials.',
  })
  @ApiNotFoundResponse({
    description: 'The seller or avatar was not found.',
  })
  @ApiConflictResponse({
    description: 'The email or phone already exists.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
  })
  async handle(
    @Body(bodyValidationPipe) body: EditSellerBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.editSeller.execute({
      sellerId: user.sub,
      ...body,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case WrongCredentialsError:
          throw new ForbiddenException(error.message)
        case NewPasswordMustBeDifferentError:
          throw new BadRequestException(error.message)
        case SellerEmailAlreadyExistsError:
          throw new ConflictException(error.message)
        case SellerPhoneAlreadyExistsError:
          throw new ConflictException(error.message)
        default:
          // Log the unknown error for debugging
          console.error(`Unexpected error in ${this.constructor.name}`, error)
          throw new InternalServerErrorException('An unexpected error occurred')
      }
    }

    const { sellerProfile } = result.value

    return SellerProfilePresenter.toHTTP(sellerProfile)
  }
}
