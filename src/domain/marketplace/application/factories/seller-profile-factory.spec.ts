import { makeSeller } from 'test/factories/make-seller'
import { makeAttachment } from 'test/factories/make-attachment'
import { SellerProfileFactory } from './seller-profile-factory'

let sut: SellerProfileFactory

describe('SellerProfileFactory', () => {
  beforeEach(() => {
    sut = new SellerProfileFactory()
  })

  it('should create a seller profile without avatar when attachment is null', () => {
    const seller = makeSeller()

    const sellerProfile = sut.create({ seller, avatar: null })

    // VO/Entity equality
    expect(sellerProfile.sellerId.equals(seller.id)).toBe(true)
    expect(sellerProfile.avatar).toBeNull()
    // Primitive equality
    expect(sellerProfile.name).toBe(seller.name)
    expect(sellerProfile.phone).toBe(seller.phone)
    expect(sellerProfile.email).toBe(seller.email)
  })

  it('should create a seller profile with avatar when attachment is not null', () => {
    const avatar = makeAttachment()
    const seller = makeSeller({ avatarId: avatar.id })

    const sellerProfile = sut.create({ seller, avatar })

    // VO/Entity equality
    expect(sellerProfile.sellerId.equals(seller.id)).toBe(true)
    expect(sellerProfile.avatar?.equals(avatar)).toBe(true)
    // Primitive equality
    expect(sellerProfile.name).toBe(seller.name)
    expect(sellerProfile.phone).toBe(seller.phone)
    expect(sellerProfile.email).toBe(seller.email)
  })

  it('should never include password in seller profile', () => {
    const seller = makeSeller({ password: 'super-secret' })
    const sellerProfile = sut.create({ seller, avatar: null })

    expect(sellerProfile).not.toHaveProperty('password')
  })
})
