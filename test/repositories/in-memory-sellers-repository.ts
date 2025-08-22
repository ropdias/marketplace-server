/* eslint-disable @typescript-eslint/require-await */
import { SellersRepository } from '@/domain/marketplace/application/repositories/sellers-repository'
import { Seller } from '@/domain/marketplace/enterprise/entities/seller'

export class InMemorySellersRepository implements SellersRepository {
  public items: Seller[] = []

  async findById(id: string): Promise<Seller | null> {
    const seller = this.items.find((item) => item.id.toString() === id)

    if (!seller) {
      return null
    }

    return seller
  }

  async findByEmail(email: string): Promise<Seller | null> {
    const seller = this.items.find((item) => item.email === email)

    if (!seller) {
      return null
    }

    return seller
  }

  async findByPhone(phone: string): Promise<Seller | null> {
    const seller = this.items.find((item) => item.phone === phone)

    if (!seller) {
      return null
    }

    return seller
  }

  async findManyByIds(ids: string[]): Promise<Seller[]> {
    const idsSet = new Set(ids)
    return this.items.filter((item) => idsSet.has(item.id.toString()))
  }

  async create(seller: Seller): Promise<void> {
    this.items.push(seller)
  }

  async save(seller: Seller): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id === seller.id)

    this.items[itemIndex] = seller
  }
}
