import { InMemorySellersRepository } from 'test/repositories/in-memory-sellers-repository'
import { SellerProfileFactory } from '../factories/seller-profile-factory'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'
import { SellerProfileMapper } from '../mappers/seller-profile-mapper'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { CreateSellerUseCase } from './create-seller'
import { PasswordIsDifferentError } from './errors/password-is-different-error'
import { makeSeller } from 'test/factories/make-seller'
import { SellerEmailAlreadyExistsError } from './errors/seller-email-already-exists-error'
import { SellerPhoneAlreadyExistsError } from './errors/seller-phone-already-exists-error'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { makeAttachment } from 'test/factories/make-attachment'
import { SellerProfileAssembler } from '../assemblers/seller-profile-assembler'

let inMemorySellersRepository: InMemorySellersRepository
let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let fakeHasher: FakeHasher
let sellerProfileAssembler: SellerProfileAssembler
let sut: CreateSellerUseCase

describe('Create Seller', () => {
  beforeEach(() => {
    inMemorySellersRepository = new InMemorySellersRepository()
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    fakeHasher = new FakeHasher()
    sellerProfileAssembler = new SellerProfileAssembler(
      inMemoryAttachmentsRepository,
    )
    sut = new CreateSellerUseCase(
      inMemorySellersRepository,
      inMemoryAttachmentsRepository,
      fakeHasher,
      sellerProfileAssembler,
    )
  })

  it('should be able to create a new seller without avatar', async () => {
    const seller = makeSeller({
      name: 'Seller',
      phone: '123456789',
      email: 'seller@example.com',
      password: 'password',
      avatarId: null,
    })

    const result = await sut.execute({
      name: seller.name,
      phone: seller.phone,
      email: seller.email,
      avatarId: seller.avatarId ? seller.avatarId.toString() : null,
      password: seller.password,
      passwordConfirmation: seller.password,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(inMemorySellersRepository.items).toHaveLength(1)
      const createdSeller = inMemorySellersRepository.items[0]
      const sellerProfile = SellerProfileFactory.create({
        seller: createdSeller,
        avatar: null,
      })
      const sellerProfileDTO = SellerProfileMapper.toDTO(sellerProfile)

      expect(createdSeller).toMatchObject({
        name: seller.name,
        phone: seller.phone,
        email: seller.email,
        avatarId: null,
      })
      expect(result.value.sellerProfile).toMatchObject(sellerProfileDTO)
    }
  })

  it('should be able to create a new seller with avatar', async () => {
    const avatarId = UniqueEntityID.create({
      value: 'non-existent-attachment-id',
    })
    const avatar = makeAttachment({}, avatarId)
    await inMemoryAttachmentsRepository.createMany([avatar])

    const seller = makeSeller({
      name: 'Seller',
      phone: '123456789',
      email: 'seller@example.com',
      password: 'password',
      avatarId,
    })

    const result = await sut.execute({
      name: seller.name,
      phone: seller.phone,
      email: seller.email,
      avatarId: seller.avatarId ? seller.avatarId.toString() : null,
      password: seller.password,
      passwordConfirmation: seller.password,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(inMemorySellersRepository.items).toHaveLength(1)
      const createdSeller = inMemorySellersRepository.items[0]
      const sellerProfile = SellerProfileFactory.create({
        seller: createdSeller,
        avatar,
      })
      const sellerProfileDTO = SellerProfileMapper.toDTO(sellerProfile)

      expect(createdSeller).toMatchObject({
        name: seller.name,
        phone: seller.phone,
        email: seller.email,
      })
      expect(createdSeller.avatarId?.equals(avatarId)).toBe(true)
      expect(result.value.sellerProfile).toMatchObject(sellerProfileDTO)
    }
  })

  it('should return PasswordIsDifferentError if passwords do not match', async () => {
    const seller = makeSeller({
      name: 'Seller',
      phone: '123456789',
      email: 'seller@example.com',
      password: 'password',
      avatarId: null,
    })

    const result = await sut.execute({
      name: seller.name,
      phone: seller.phone,
      email: seller.email,
      avatarId: seller.avatarId ? seller.avatarId.toString() : null,
      password: seller.password,
      passwordConfirmation: 'wrong-password',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(PasswordIsDifferentError)
    }
  })

  it('should return SellerEmailAlreadyExistsError if email is already taken', async () => {
    const otherSeller = makeSeller({
      email: 'seller@example.com',
    })
    await inMemorySellersRepository.create(otherSeller)

    const seller = makeSeller({
      name: 'Seller',
      phone: '123456789',
      email: 'seller@example.com',
      password: 'password',
      avatarId: null,
    })

    const result = await sut.execute({
      name: seller.name,
      phone: seller.phone,
      email: seller.email,
      avatarId: seller.avatarId ? seller.avatarId.toString() : null,
      password: seller.password,
      passwordConfirmation: seller.password,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(SellerEmailAlreadyExistsError)
    }
  })

  it('should return SellerPhoneAlreadyExistsError if phone is already taken', async () => {
    const otherSeller = makeSeller({
      phone: '123456789',
    })
    await inMemorySellersRepository.create(otherSeller)

    const seller = makeSeller({
      name: 'Seller',
      phone: '123456789',
      email: 'seller@example.com',
      password: 'password',
      avatarId: null,
    })

    const result = await sut.execute({
      name: seller.name,
      phone: seller.phone,
      email: seller.email,
      avatarId: seller.avatarId ? seller.avatarId.toString() : null,
      password: seller.password,
      passwordConfirmation: seller.password,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(SellerPhoneAlreadyExistsError)
    }
  })

  it('should return ResourceNotFoundError if avatarId is not found', async () => {
    const avatarId = UniqueEntityID.create({
      value: 'non-existent-attachment-id',
    })

    const seller = makeSeller({
      name: 'Seller',
      phone: '123456789',
      email: 'seller@example.com',
      password: 'password',
      avatarId,
    })

    const result = await sut.execute({
      name: seller.name,
      phone: seller.phone,
      email: seller.email,
      avatarId: seller.avatarId ? seller.avatarId.toString() : null,
      password: seller.password,
      passwordConfirmation: seller.password,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })
})
