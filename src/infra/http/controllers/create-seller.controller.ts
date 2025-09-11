import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
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
import { SellerProfilePresenter } from '../presenters/seller-profile-presenter'

const createSellerBodySchema = z.object({
  name: z.string(),
  phone: z.string(),
  email: z.email(),
  avatarId: z.string().nullable(),
  password: z.string(),
  passwordConfirmation: z.string(),
})

type CreateSellerBodySchema = z.infer<typeof createSellerBodySchema>

@Controller('/sellers')
@Public()
export class CreateSellerController {
  constructor(private createSeller: CreateSellerUseCase) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createSellerBodySchema))
  async handle(@Body() body: CreateSellerBodySchema) {
    const { name, phone, email, avatarId, password, passwordConfirmation } =
      body

    const result = await this.createSeller.execute({
      name,
      phone,
      email,
      avatarId,
      password,
      passwordConfirmation,
    })

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
          throw new BadRequestException(error.message)
      }
    }

    const { sellerProfile } = result.value

    return {
      seller: SellerProfilePresenter.toHTTP(sellerProfile),
    }
  }
}
