import { InMemorySellersRepository } from 'test/repositories/in-memory-sellers-repository'
import { SellerProfileFactory } from '../factories/seller-profile-factory'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'
import { SellerProfileMapper } from '../mappers/seller-profile-mapper'
import { AttachmentMapper } from '../mappers/attachment-mapper'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { CreateSellerUseCase } from './create-seller'
import { PasswordIsDifferentError } from './errors/password-is-different-error'
import { makeSeller } from 'test/factories/make-seller'
import { SellerEmailAlreadyExistsError } from './errors/seller-email-already-exists-error'
import { SellerPhoneAlreadyExistsError } from './errors/seller-phone-already-exists-error'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { makeAttachment } from 'test/factories/make-attachment'

let inMemorySellersRepository: InMemorySellersRepository
let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let fakeHasher: FakeHasher
let sellerProfileFactory: SellerProfileFactory
let attachmentMapper: AttachmentMapper
let sellerProfileMapper: SellerProfileMapper
let sut: CreateSellerUseCase

describe('Create Seller', () => {
  beforeEach(() => {
    inMemorySellersRepository = new InMemorySellersRepository()
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    fakeHasher = new FakeHasher()
    sellerProfileFactory = new SellerProfileFactory(
      inMemoryAttachmentsRepository,
    )
    attachmentMapper = new AttachmentMapper()
    sellerProfileMapper = new SellerProfileMapper(attachmentMapper)
    sut = new CreateSellerUseCase(
      inMemorySellersRepository,
      inMemoryAttachmentsRepository,
      fakeHasher,
      sellerProfileFactory,
      sellerProfileMapper,
    )
  })

  it('should be able to create a new seller without avatar', async () => {
    const result = await sut.execute({
      name: 'Seller',
      phone: '123456789',
      email: 'seller@example.com',
      avatarId: null,
      password: 'password',
      passwordConfirmation: 'password',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(inMemorySellersRepository.items).toHaveLength(1)
      expect(inMemorySellersRepository.items[0]).toMatchObject({
        name: 'Seller',
        phone: '123456789',
        email: 'seller@example.com',
        avatarId: null,
      })
      expect(result.value.sellerProfile).toMatchObject({
        sellerId: inMemorySellersRepository.items[0].id.toString(),
        name: 'Seller',
        phone: '123456789',
        email: 'seller@example.com',
        avatar: null,
      })
    }
  })

  it('should be able to create a new seller with avatar', async () => {
    const avatarId = UniqueEntityID.create({
      value: 'non-existent-attachment-id',
    })
    const avatar = makeAttachment({}, avatarId)
    await inMemoryAttachmentsRepository.create(avatar)

    const result = await sut.execute({
      name: 'Seller',
      phone: '123456789',
      email: 'seller@example.com',
      avatarId: avatarId.toString(),
      password: 'password',
      passwordConfirmation: 'password',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(inMemorySellersRepository.items).toHaveLength(1)
      expect(inMemorySellersRepository.items[0]).toMatchObject({
        name: 'Seller',
        phone: '123456789',
        email: 'seller@example.com',
      })
      expect(inMemorySellersRepository.items[0].avatarId?.toString()).toBe(
        avatarId.toString(),
      )
      expect(result.value.sellerProfile).toMatchObject({
        sellerId: inMemorySellersRepository.items[0].id.toString(),
        name: 'Seller',
        phone: '123456789',
        email: 'seller@example.com',
        avatar: { id: avatar.id.toString(), url: avatar.url },
      })
    }
  })

  it('should return PasswordIsDifferentError if passwords do not match', async () => {
    const result = await sut.execute({
      name: 'Seller',
      phone: '123456789',
      email: 'seller@example.com',
      avatarId: null,
      password: '123',
      passwordConfirmation: '456',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(PasswordIsDifferentError)
    }
  })

  it('should return SellerEmailAlreadyExistsError if email is already taken', async () => {
    const seller = makeSeller({
      email: 'seller@example.com',
    })
    await inMemorySellersRepository.create(seller)

    const result = await sut.execute({
      name: 'Seller',
      phone: '123456789',
      email: 'seller@example.com',
      avatarId: null,
      password: 'password',
      passwordConfirmation: 'password',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(SellerEmailAlreadyExistsError)
    }
  })

  it('should return SellerPhoneAlreadyExistsError if phone is already taken', async () => {
    const seller = makeSeller({
      phone: '123456789',
    })
    await inMemorySellersRepository.create(seller)

    const result = await sut.execute({
      name: 'Seller',
      phone: '123456789',
      email: 'seller@example.com',
      avatarId: null,
      password: 'password',
      passwordConfirmation: 'password',
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

    const result = await sut.execute({
      name: 'Seller',
      phone: '123456789',
      email: 'seller@example.com',
      avatarId: avatarId.toString(),
      password: 'password',
      passwordConfirmation: 'password',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should never include password field in the seller profile DTO', async () => {
    const result = await sut.execute({
      name: 'Seller',
      phone: '123456789',
      email: 'seller@example.com',
      avatarId: null,
      password: 'password',
      passwordConfirmation: 'password',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(Object.keys(result.value)).toEqual(['sellerProfile'])
      expect(result.value.sellerProfile).not.toHaveProperty('password')
    }
  })
})
