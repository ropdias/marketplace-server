import { AttachmentDTO } from '@/domain/marketplace/application/dtos/attachment-dtos'
import { ApiProperty } from '@nestjs/swagger'
import { z } from 'zod'

export const attachmentDTOSchema = z.object({
  id: z.uuid(),
  url: z.url(),
})

export type AttachmentDTOResponseType = z.infer<typeof attachmentDTOSchema>

export const attachmentsResponseSchema = z.object({
  attachments: z.array(attachmentDTOSchema),
})

export type AttachmentsResponseType = z.infer<typeof attachmentsResponseSchema>

export class AttachmentDTOResponse implements AttachmentDTOResponseType {
  @ApiProperty({ format: 'uuid' }) id: string
  @ApiProperty() url: string

  constructor(attachment: AttachmentDTO, bucketName: string, region: string) {
    this.id = attachment.id
    this.url = `https://${bucketName}.s3.${region}.amazonaws.com/${attachment.url}`
  }
}

export class AttachmentsResponse implements AttachmentsResponseType {
  @ApiProperty({ type: [AttachmentDTOResponse] })
  attachments: AttachmentDTOResponse[]

  constructor(dtos: AttachmentDTO[], bucketName: string, region: string) {
    this.attachments = dtos.map(
      (dto) => new AttachmentDTOResponse(dto, bucketName, region),
    )
  }
}

export class AttachmentPresenter {
  static toHTTPMany(
    dtos: AttachmentDTO[],
    bucketName: string,
    region: string,
  ): AttachmentsResponse {
    return new AttachmentsResponse(dtos, bucketName, region)
  }
}
