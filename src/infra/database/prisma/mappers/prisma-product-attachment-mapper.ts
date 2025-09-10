import {
  Prisma,
  Attachment as PrismaAttachment,
} from '@/generated/prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ProductAttachment } from '@/domain/marketplace/enterprise/entities/product-attachment'

export class PrismaProductAttachmentMapper {
  static toDomain(raw: PrismaAttachment): ProductAttachment {
    if (!raw.productId) {
      throw new Error('Invalid attachment type.')
    }

    return ProductAttachment.create(
      {
        productId: UniqueEntityID.create({ value: raw.productId }),
        attachmentId: UniqueEntityID.create({ value: raw.id }),
      },
      UniqueEntityID.create({ value: raw.id }),
    )
  }

  static toPrismaUpdateManyArgs(
    attachments: ProductAttachment[],
  ): Prisma.AttachmentUpdateManyArgs {
    const attachmentIds = attachments.map((attachment) => {
      return attachment.attachmentId.toString()
    })

    return {
      where: {
        id: {
          in: attachmentIds,
        },
      },
      data: {
        productId: attachments[0].productId.toString(),
      },
    }
  }
}
