import { makeSeller } from 'test/factories/make-seller'
import { InMemorySellersRepository } from 'test/repositories/in-memory-sellers-repository'
import { GetSellerProfileUseCase } from './get-seller-profile'
import { SellerProfileFactory } from '../factories/seller-profile-factory'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'
import { makeAttachment } from 'test/factories/make-attachment'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { SellerProfileMapper } from '../mappers/seller-profile-mapper'
import { AttachmentMapper } from '../mappers/attachment-mapper'

let inMemorySellersRepository: InMemorySellersRepository
let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let sellerProfileFactory: SellerProfileFactory
let attachmentMapper: AttachmentMapper
let sellerProfileMapper: SellerProfileMapper
let sut: GetSellerProfileUseCase

describe('Get Seller Profile', () => {
  beforeEach(() => {
    inMemorySellersRepository = new InMemorySellersRepository()
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    sellerProfileFactory = new SellerProfileFactory(
      inMemoryAttachmentsRepository,
    )
    attachmentMapper = new AttachmentMapper()
    sellerProfileMapper = new SellerProfileMapper(attachmentMapper)
    sut = new GetSellerProfileUseCase(
      inMemorySellersRepository,
      sellerProfileFactory,
      sellerProfileMapper,
    )
  })

  it('should be able to get a seller profile without an avatar', async () => {
    const seller = makeSeller({ name: 'Seller 1' })

    await inMemorySellersRepository.create(seller)

    const result = await sut.execute({ sellerId: seller.id.toString() })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value).toStrictEqual({
        sellerProfile: {
          sellerId: seller.id.toString(),
          name: seller.name,
          phone: seller.phone,
          email: seller.email,
          avatar: null,
        },
      })
    }
  })

  it('should be able to get a seller profile with an avatar', async () => {
    const seller = makeSeller({ name: 'Seller 1' })
    const avatar = makeAttachment()
    seller.avatarId = avatar.id

    await inMemoryAttachmentsRepository.create(avatar)
    await inMemorySellersRepository.create(seller)

    const result = await sut.execute({ sellerId: seller.id.toString() })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value).toStrictEqual({
        sellerProfile: {
          sellerId: seller.id.toString(),
          name: seller.name,
          phone: seller.phone,
          email: seller.email,
          avatar: { id: avatar.id.toString(), url: avatar.url },
        },
      })
    }
  })

  it('should return ResourceNotFoundError if seller does not exist', async () => {
    const result = await sut.execute({ sellerId: 'non-existent-id' })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return profile with avatar = null if avatarId points to non-existent attachment', async () => {
    const seller = makeSeller({ name: 'Seller X' })
    seller.avatarId = UniqueEntityID.create({
      value: 'non-existent-attachment-id',
    })

    await inMemorySellersRepository.create(seller)

    const result = await sut.execute({ sellerId: seller.id.toString() })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.sellerProfile.avatar).toBeNull()
    }
  })

  it('should never include password field in the seller profile DTO', async () => {
    const seller = makeSeller({ name: 'Seller 1', password: 'secret' })
    await inMemorySellersRepository.create(seller)

    const result = await sut.execute({ sellerId: seller.id.toString() })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.sellerProfile).not.toHaveProperty('password')
    }
  })
})
