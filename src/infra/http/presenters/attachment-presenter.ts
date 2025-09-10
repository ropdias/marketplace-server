import { AttachmentDTO } from '@/domain/marketplace/application/dtos/attachment-dtos'

export class AttachmentPresenter {
  static toHTTP(attachment: AttachmentDTO) {
    return {
      id: attachment.id,
      url: attachment.url,
    }
  }
}
