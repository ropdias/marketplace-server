import { makeSeller } from 'test/factories/make-seller'
import { makeAttachment } from 'test/factories/make-attachment'
import { SellerProfileFactory } from './seller-profile-factory'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let sut: SellerProfileFactory

describe('SellerProfileFactory', () => {
  beforeEach(() => {
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    sut = new SellerProfileFactory(inMemoryAttachmentsRepository)
  })

  it('should create a seller profile without avatar when attachment is null', async () => {
    const seller = makeSeller()

    const sellerProfile = await sut.create({ seller })

    // VO/Entity equality
    expect(sellerProfile.sellerId.equals(seller.id)).toBe(true)
    expect(sellerProfile.avatar).toBeNull()
    // Primitive equality
    expect(sellerProfile.name).toBe(seller.name)
    expect(sellerProfile.phone).toBe(seller.phone)
    expect(sellerProfile.email).toBe(seller.email)
  })

  it('should create a seller profile with avatar when attachment is not null', async () => {
    const avatar = makeAttachment()
    await inMemoryAttachmentsRepository.create(avatar)
    const seller = makeSeller({ avatarId: avatar.id })

    const sellerProfile = await sut.create({ seller })

    // VO/Entity equality
    expect(sellerProfile.sellerId.equals(seller.id)).toBe(true)
    expect(sellerProfile.avatar?.equals(avatar)).toBe(true)
    // Primitive equality
    expect(sellerProfile.name).toBe(seller.name)
    expect(sellerProfile.phone).toBe(seller.phone)
    expect(sellerProfile.email).toBe(seller.email)
  })

  it('should create a seller profile with avatar === null if attachment does not exist', async () => {
    const seller = makeSeller({
      avatarId: UniqueEntityID.create({ value: 'non-existing-id' }),
    })

    const sellerProfile = await sut.create({ seller })

    // VO/Entity equality
    expect(sellerProfile.sellerId.equals(seller.id)).toBe(true)
    expect(sellerProfile.avatar).toBeNull()
    // Primitive equality
    expect(sellerProfile.name).toBe(seller.name)
    expect(sellerProfile.phone).toBe(seller.phone)
    expect(sellerProfile.email).toBe(seller.email)
  })
})
