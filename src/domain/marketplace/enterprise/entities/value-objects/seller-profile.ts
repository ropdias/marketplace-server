import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ValueObject } from '@/core/entities/value-object'
import { Attachment } from '../attachment'

export interface SellerProfileProps {
  sellerId: UniqueEntityID
  name: string
  phone: string
  email: string
  avatar: Attachment | null
}

export class SellerProfile extends ValueObject<SellerProfileProps> {
  get sellerId() {
    return this.props.sellerId
  }

  get name() {
    return this.props.name
  }

  get phone() {
    return this.props.phone
  }

  get email() {
    return this.props.email
  }

  get avatar() {
    return this.props.avatar
  }

  static create(props: SellerProfileProps) {
    return new SellerProfile(props)
  }
}
