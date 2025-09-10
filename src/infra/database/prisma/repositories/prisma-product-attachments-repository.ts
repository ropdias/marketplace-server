import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { ProductAttachmentsRepository } from '@/domain/marketplace/application/repositories/product-attachments-repository'
import { ProductAttachment } from '@/domain/marketplace/enterprise/entities/product-attachment'
import { PrismaProductAttachmentMapper } from '../mappers/prisma-product-attachment-mapper'

@Injectable()
export class PrismaProductAttachmentsRepository
  implements ProductAttachmentsRepository
{
  constructor(private prisma: PrismaService) {}

  async updateMany(attachments: ProductAttachment[]): Promise<void> {
    if (attachments.length === 0) {
      return
    }

    const data =
      PrismaProductAttachmentMapper.toPrismaUpdateManyArgs(attachments)

    await this.prisma.attachment.updateMany(data)
  }

  async deleteMany(attachments: ProductAttachment[]): Promise<void> {
    if (attachments.length === 0) {
      return
    }

    const attachmentIds = attachments.map((attachment) => {
      return attachment.id.toString()
    })

    await this.prisma.attachment.deleteMany({
      where: {
        id: {
          in: attachmentIds,
        },
      },
    })
  }

  async findManyByProductId(productId: string): Promise<ProductAttachment[]> {
    const productAttachments = await this.prisma.attachment.findMany({
      where: {
        productId,
      },
    })

    return productAttachments.map((attachment) =>
      PrismaProductAttachmentMapper.toDomain(attachment),
    )
  }

  async deleteManyByProductId(productId: string): Promise<void> {
    await this.prisma.attachment.deleteMany({
      where: {
        productId,
      },
    })
  }
}
