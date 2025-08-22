/* eslint-disable @typescript-eslint/require-await */
import { AttachmentsRepository } from '@/domain/marketplace/application/repositories/attachments-repository'
import { Attachment } from '@/domain/marketplace/enterprise/entities/attachment'

export class InMemoryAttachmentsRepository implements AttachmentsRepository {
  public items: Attachment[] = []

  async findById(id: string) {
    const attachment = this.items.find((item) => item.id.toString() === id)

    if (!attachment) {
      return null
    }

    return attachment
  }

  async findManyByIds(ids: string[]) {
    const idsSet = new Set(ids)
    return this.items.filter((item) => idsSet.has(item.id.toString()))
  }

  async create(attachment: Attachment) {
    this.items.push(attachment)
  }
}
