import { Seller } from '../../enterprise/entities/seller'

export abstract class SellersRepository {
  abstract findById(id: string): Promise<Seller | null>
  abstract findByEmail(email: string): Promise<Seller | null>
  abstract findByPhone(phone: string): Promise<Seller | null>
  abstract findManyByIds(ids: string[]): Promise<Seller[]>
  abstract create(seller: Seller): Promise<void>
  abstract save(seller: Seller): Promise<void>
}
