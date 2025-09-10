import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { InvalidAttachmentTypeError } from './errors/invalid-attachment-type-error'
import { Attachment } from '../../enterprise/entities/attachment'
import { AttachmentsRepository } from '../repositories/attachments-repository'
import { Uploader } from '../storage/uploader'
import { AttachmentDTO } from '../dtos/attachment-dtos'
import { AttachmentMapper } from '../mappers/attachment-mapper'
import { UploadFailedError } from './errors/upload-failed-error'

interface UploadAndCreateAttachmentsRequest {
  files: {
    fileName: string
    fileType: string
    body: Buffer
  }[]
}

type UploadAndCreateAttachmentsResponse = Either<
  InvalidAttachmentTypeError,
  { attachments: AttachmentDTO[] }
>

@Injectable()
export class UploadAndCreateAttachmentsUseCase {
  constructor(
    private attachmentsRepository: AttachmentsRepository,
    private uploader: Uploader,
    private attachmentMapper: AttachmentMapper,
  ) {}

  async execute({
    files,
  }: UploadAndCreateAttachmentsRequest): Promise<UploadAndCreateAttachmentsResponse> {
    for (const file of files) {
      if (!/^(image\/(jpeg|png))$/.test(file.fileType)) {
        return left(new InvalidAttachmentTypeError(file.fileType))
      }
    }

    const attachments: Attachment[] = []
    const uploadedUrls: string[] = []

    try {
      for (const file of files) {
        const { url } = await this.uploader.upload(file)
        uploadedUrls.push(url)
        const attachment = Attachment.create({ url })
        attachments.push(attachment)
      }

      await this.attachmentsRepository.createMany(attachments)

      return right({
        attachments: attachments.map((a) => this.attachmentMapper.toDTO(a)),
      })
    } catch (err: unknown) {
      if (uploadedUrls.length > 0) {
        try {
          await this.uploader.deleteMany(uploadedUrls)
        } catch (cleanupError) {
          // If cleanup fails, log the error but do not mask the original error
          console.error('Rollback failed:', cleanupError)
        }
      }

      let message = 'Unknown error during upload'
      if (err instanceof Error) {
        message = err.message
      } else if (typeof err === 'string') {
        message = err
      }

      return left(new UploadFailedError(message))
    }
  }
}
