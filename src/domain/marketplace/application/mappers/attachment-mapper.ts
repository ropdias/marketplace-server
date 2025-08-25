import { Injectable } from '@nestjs/common'
import { Attachment } from '../../enterprise/entities/attachment'
import { AttachmentDTO } from '../dtos/attachment-dtos'

@Injectable()
export class AttachmentMapper {
  public toDTO(attachment: Attachment): AttachmentDTO {
    return {
      id: attachment.id.toString(),
      url: attachment.url,
    }
  }
}
