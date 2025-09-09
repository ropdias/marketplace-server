import {
  Prisma,
  Attachment as PrismaAttachment,
} from '@/generated/prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Attachment } from '@/domain/marketplace/enterprise/entities/attachment'

export class PrismaAttachmentMapper {
  static toDomain(raw: PrismaAttachment): Attachment {
    return Attachment.create(
      {
        url: raw.url,
      },
      UniqueEntityID.create({ value: raw.id }),
    )
  }

  static toPrisma(
    attachment: Attachment,
  ): Prisma.AttachmentUncheckedCreateInput {
    return {
      id: attachment.id.toString(),
      url: attachment.url,
    }
  }
}
