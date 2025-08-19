import { randomUUID } from 'node:crypto'
import { ValueObject } from './value-object'

interface UniqueEntityIDProps {
  value: string
}

export class UniqueEntityID extends ValueObject<UniqueEntityIDProps> {
  static create(props?: UniqueEntityIDProps): UniqueEntityID {
    return new UniqueEntityID({
      value: props?.value ?? randomUUID(),
    })
  }

  toString() {
    return this.props.value
  }

  toValue() {
    return this.props.value
  }

  equals(id: UniqueEntityID): boolean {
    return id.toValue() === this.props.value
  }
}
