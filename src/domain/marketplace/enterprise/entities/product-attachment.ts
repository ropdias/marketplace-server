import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

export interface ProductAttachmentProps {
  productId: UniqueEntityID
  attachmentId: UniqueEntityID
}

export class ProductAttachment extends Entity<ProductAttachmentProps> {
  get productId() {
    return this.props.productId
  }

  get attachmentId() {
    return this.props.attachmentId
  }

  static create(props: ProductAttachmentProps, id?: UniqueEntityID) {
    const attachment = new ProductAttachment(props, id)

    return attachment
  }
}
