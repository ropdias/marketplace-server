import { PipeTransform, BadRequestException } from '@nestjs/common'
import { z, ZodError, ZodType } from 'zod'
import { fromZodError } from 'zod-validation-error'

export class ZodValidationPipe<T extends ZodType>
  implements PipeTransform<z.input<T>, z.output<T>>
{
  constructor(private schema: T) {}

  transform(value: z.input<T>): z.output<T> {
    try {
      return this.schema.parse(value)
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: 'Validation failed',
          statusCode: 400,
          errors: fromZodError(error),
        })
      }

      throw new BadRequestException('Validation failed')
    }
  }
}
