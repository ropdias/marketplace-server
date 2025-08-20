import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

export interface AttachmentProps {
  url: string
}

export class Attachment extends Entity<AttachmentProps> {
  get url() {
    return this.props.url
  }

  static create(props: AttachmentProps, id?: UniqueEntityID) {
    const attachment = new Attachment(props, id)

    return attachment
  }
}
