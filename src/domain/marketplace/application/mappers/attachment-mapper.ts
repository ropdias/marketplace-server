import { Attachment } from '../../enterprise/entities/attachment'
import { AttachmentDTO } from '../dtos/attachment-dtos'

export class AttachmentMapper {
  static toDTO(attachment: Attachment): AttachmentDTO {
    return {
      id: attachment.id.toString(),
      url: attachment.url,
    }
  }
}
