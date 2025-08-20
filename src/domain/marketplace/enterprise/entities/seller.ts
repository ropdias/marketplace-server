import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { AggregateRoot } from '@/core/entities/aggregate-root'
import { Attachment } from './attachment'

interface SellerProps {
  name: string
  phone: string
  email: string
  avatar?: Attachment
}

export class Seller extends AggregateRoot<SellerProps> {
  get name() {
    return this.props.name
  }

  get phone() {
    return this.props.name
  }

  get email() {
    return this.props.name
  }

  get avatar() {
    return this.props.avatar
  }

  static create(props: SellerProps, id?: UniqueEntityID) {
    const seller = new Seller(props, id)

    return seller
  }
}
