import { Attachment } from '../../enterprise/entities/attachment'

export abstract class AttachmentsRepository {
  abstract findById(id: string): Promise<Attachment | null>
  abstract findManyByIds(ids: string[]): Promise<Attachment[]>
  abstract createMany(attachments: Attachment[]): Promise<void>
}
