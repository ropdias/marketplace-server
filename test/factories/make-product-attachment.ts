import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  ProductAttachment,
  ProductAttachmentProps,
} from '@/domain/marketplace/enterprise/entities/product-attachment'

export function makeProductAttachment(
  override: Partial<ProductAttachmentProps> = {},
  id?: UniqueEntityID,
) {
  const productAttachment = ProductAttachment.create(
    {
      productId: UniqueEntityID.create(),
      attachmentId: UniqueEntityID.create(),
      ...override, // we will override any props that have been passed to make this entity
    },
    id,
  )

  return productAttachment
}
