import { AttachmentDTO } from '@/domain/marketplace/application/dtos/attachment-dtos'
import { ApiProperty } from '@nestjs/swagger'

export class AttachmentDTOResponse {
  @ApiProperty({ format: 'uuid' }) id: string
  @ApiProperty() url: string

  constructor(attachment: AttachmentDTO) {
    this.id = attachment.id
    this.url = attachment.url
  }
}

export class AttachmentsResponse {
  @ApiProperty({ type: [AttachmentDTOResponse] })
  attachments: AttachmentDTOResponse[]

  constructor(dtos: AttachmentDTO[]) {
    this.attachments = dtos.map((dto) => new AttachmentDTOResponse(dto))
  }
}

export class AttachmentPresenter {
  static toHTTPArray(dtos: AttachmentDTO[]): AttachmentsResponse {
    return new AttachmentsResponse(dtos)
  }
}
