import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { AttachmentsRepository } from '@/domain/marketplace/application/repositories/attachments-repository'
import { Attachment } from '@/domain/marketplace/enterprise/entities/attachment'
import { PrismaAttachmentMapper } from '../mappers/prisma-attachment-mapper'

@Injectable()
export class PrismaAttachmentsRepository implements AttachmentsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Attachment | null> {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    })

    if (!attachment) return null

    return PrismaAttachmentMapper.toDomain(attachment)
  }

  async findManyByIds(ids: string[]): Promise<Attachment[]> {
    const attachments = await this.prisma.attachment.findMany({
      where: { id: { in: ids } },
    })

    return attachments.map((attachment) =>
      PrismaAttachmentMapper.toDomain(attachment),
    )
  }

  async createMany(attachments: Attachment[]): Promise<void> {
    const data = attachments.map((a) => PrismaAttachmentMapper.toPrisma(a))
    await this.prisma.attachment.createMany({ data })
  }
}
