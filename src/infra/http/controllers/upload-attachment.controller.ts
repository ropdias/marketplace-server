import { UploadAndCreateAttachmentsUseCase } from '@/domain/marketplace/application/use-cases/upload-and-create-attachments'
import { InvalidAttachmentTypeError } from '@/domain/marketplace/application/use-cases/errors/invalid-attachment-type-error'
import { UploadFailedError } from '@/domain/marketplace/application/use-cases/errors/upload-failed-error'
import {
  BadRequestException,
  Controller,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import {
  AttachmentPresenter,
  AttachmentsResponse,
} from '../presenters/attachment-presenter'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger'
import { EnvService } from '@/infra/env/env.service'

class UploadAttachmentsBody {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description:
      'Array of image files to upload (PNG, JPG, JPEG). Max size: 2MB per file.',
  })
  files!: Express.Multer.File[]
}

@Controller('/attachments')
@ApiTags('Attachments')
export class UploadAndCreateAttachmentsController {
  constructor(
    private uploadAndCreateAttachments: UploadAndCreateAttachmentsUseCase,
    private env: EnvService,
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload attachments' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UploadAttachmentsBody,
  })
  @ApiCreatedResponse({
    description: 'The attachments were successfully uploaded.',
    type: AttachmentsResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid file type.' })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
  })
  async handle(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 1024 * 1024 * 2, // 2mb
          }),
          new FileTypeValidator({
            fileType: /^(image\/png|image\/jpeg)$/,
          }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {
    const result = await this.uploadAndCreateAttachments.execute({
      files: files.map((file) => ({
        fileName: file.originalname,
        fileType: file.mimetype,
        body: file.buffer,
      })),
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case InvalidAttachmentTypeError:
          throw new BadRequestException(error.message)
        case UploadFailedError:
          console.error(`Unexpected error in ${this.constructor.name}`, error)
          throw new InternalServerErrorException('An unexpected error occurred')
        default:
          // Log the unknown error for debugging
          console.error(`Unexpected error in ${this.constructor.name}`, error)
          throw new InternalServerErrorException('An unexpected error occurred')
      }
    }

    const { attachments } = result.value

    return AttachmentPresenter.toHTTPMany(
      attachments,
      this.env.get('AWS_BUCKET_NAME'),
      this.env.get('AWS_REGION'),
    )
  }
}
