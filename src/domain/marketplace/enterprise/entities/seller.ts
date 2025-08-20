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
  static create(props: SellerProps, id?: UniqueEntityID) {
    const seller = new Seller(props, id)

    return seller
  }
}
