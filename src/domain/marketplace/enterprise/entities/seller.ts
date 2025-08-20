import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { AggregateRoot } from '@/core/entities/aggregate-root'
import { Attachment } from './attachment'

interface SellerProps {
  name: string
  phone: string
  email: string
  password: string
  avatar?: Attachment
}

export class Seller extends AggregateRoot<SellerProps> {
  get name() {
    return this.props.name
  }

  set name(name: string) {
    this.props.name = name
  }

  get phone() {
    return this.props.phone
  }

  set phone(phone: string) {
    this.props.phone = phone
  }

  get email() {
    return this.props.email
  }

  set email(email: string) {
    this.props.email = email
  }

  get password() {
    return this.props.password
  }

  set password(password: string) {
    this.props.password = password
  }

  get avatar() {
    return this.props.avatar
  }

  set avatar(avatar: Attachment | undefined) {
    this.props.avatar = avatar
  }

  static create(props: SellerProps, id?: UniqueEntityID) {
    const seller = new Seller(props, id)

    return seller
  }
}
