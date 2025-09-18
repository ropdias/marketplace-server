import { makeSeller } from 'test/factories/make-seller'
import { InMemorySellersRepository } from 'test/repositories/in-memory-sellers-repository'
import { GetSellerProfileUseCase } from './get-seller-profile'
import { SellerProfileFactory } from '../factories/seller-profile-factory'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'
import { makeAttachment } from 'test/factories/make-attachment'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { SellerProfileMapper } from '../mappers/seller-profile-mapper'

let inMemorySellersRepository: InMemorySellersRepository
let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let sut: GetSellerProfileUseCase

describe('Get Seller Profile', () => {
  beforeEach(() => {
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    inMemorySellersRepository = new InMemorySellersRepository(
      inMemoryAttachmentsRepository,
    )
    sut = new GetSellerProfileUseCase(inMemorySellersRepository)
  })

  it('should be able to get a seller profile without an avatar', async () => {
    const seller = makeSeller({ name: 'Seller 1' })

    await inMemorySellersRepository.create(seller)

    const result = await sut.execute({ sellerId: seller.id.toString() })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const sellerProfile = SellerProfileFactory.create({
        seller,
        avatar: null,
      })
      const sellerProfileDTO = SellerProfileMapper.toDTO(sellerProfile)
      expect(result.value.sellerProfile).toMatchObject(sellerProfileDTO)
    }
  })

  it('should be able to get a seller profile with an avatar', async () => {
    const seller = makeSeller({ name: 'Seller 1' })
    const avatar = makeAttachment()
    seller.avatarId = avatar.id

    await inMemoryAttachmentsRepository.createMany([avatar])
    await inMemorySellersRepository.create(seller)

    const result = await sut.execute({ sellerId: seller.id.toString() })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const sellerProfile = SellerProfileFactory.create({
        seller,
        avatar,
      })
      const sellerProfileDTO = SellerProfileMapper.toDTO(sellerProfile)
      expect(result.value.sellerProfile).toMatchObject(sellerProfileDTO)
    }
  })

  it('should return ResourceNotFoundError if seller does not exist', async () => {
    const result = await sut.execute({ sellerId: 'non-existent-id' })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })
})
