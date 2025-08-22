import { faker } from '@faker-js/faker'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Attachment,
  AttachmentProps,
} from '@/domain/marketplace/enterprise/entities/attachment'

export function makeAttachment(
  override: Partial<AttachmentProps> = {},
  id?: UniqueEntityID,
) {
  const attachment = Attachment.create(
    {
      url: faker.lorem.slug(),
      ...override, // we will override any props that have been passed to make this entity
    },
    id,
  )

  return attachment
}
