import { AttachmentMapper } from './attachment-mapper'
import { SellerProfileMapper } from './seller-profile-mapper'
import { makeSeller } from 'test/factories/make-seller'
import { makeAttachment } from 'test/factories/make-attachment'
import { SellerProfile } from '../../enterprise/entities/value-objects/seller-profile'

let attachmentMapper: AttachmentMapper
let sut: SellerProfileMapper

describe('SellerProfileMapper', () => {
  beforeEach(() => {
    attachmentMapper = new AttachmentMapper()
    sut = new SellerProfileMapper(attachmentMapper)
  })

  it('should map seller profile without avatar to DTO', () => {
    const seller = makeSeller()
    const sellerProfile = SellerProfile.create({
      sellerId: seller.id,
      name: seller.name,
      phone: seller.phone,
      email: seller.email,
      avatar: null,
    })

    const dto = sut.toDTO(sellerProfile)

    expect(dto).toEqual({
      sellerId: seller.id.toString(),
      name: seller.name,
      phone: seller.phone,
      email: seller.email,
      avatar: null,
    })
  })

  it('should map seller profile with avatar to DTO', () => {
    const avatar = makeAttachment()
    const seller = makeSeller({ avatarId: avatar.id })

    const sellerProfile = SellerProfile.create({
      sellerId: seller.id,
      name: seller.name,
      phone: seller.phone,
      email: seller.email,
      avatar,
    })

    const dto = sut.toDTO(sellerProfile)

    expect(dto).toEqual({
      sellerId: seller.id.toString(),
      name: seller.name,
      phone: seller.phone,
      email: seller.email,
      avatar: attachmentMapper.toDTO(avatar),
    })
  })

  it('should never include password in DTO', () => {
    const seller = makeSeller({ password: 'super-secret' })
    const sellerProfile = SellerProfile.create({
      sellerId: seller.id,
      name: seller.name,
      phone: seller.phone,
      email: seller.email,
      avatar: null,
    })

    const dto = sut.toDTO(sellerProfile)

    expect(dto).not.toHaveProperty('password')
  })
})
