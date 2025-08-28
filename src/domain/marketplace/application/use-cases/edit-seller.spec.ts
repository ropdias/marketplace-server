import { InMemorySellersRepository } from 'test/repositories/in-memory-sellers-repository'
import { SellerProfileFactory } from '../factories/seller-profile-factory'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'
import { SellerProfileMapper } from '../mappers/seller-profile-mapper'
import { AttachmentMapper } from '../mappers/attachment-mapper'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { makeSeller } from 'test/factories/make-seller'
import { SellerEmailAlreadyExistsError } from './errors/seller-email-already-exists-error'
import { SellerPhoneAlreadyExistsError } from './errors/seller-phone-already-exists-error'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { makeAttachment } from 'test/factories/make-attachment'
import { EditSellerUseCase } from './edit-seller'
import { WrongCredentialsError } from './errors/wrong-credentials-error'
import { NewPasswordMustBeDifferentError } from './errors/new-password-must-be-different-error'

let inMemorySellersRepository: InMemorySellersRepository
let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let fakeHasher: FakeHasher
let sellerProfileFactory: SellerProfileFactory
let attachmentMapper: AttachmentMapper
let sellerProfileMapper: SellerProfileMapper
let sut: EditSellerUseCase

describe('Edit Seller', () => {
  beforeEach(() => {
    inMemorySellersRepository = new InMemorySellersRepository()
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    fakeHasher = new FakeHasher()
    sellerProfileFactory = new SellerProfileFactory(
      inMemoryAttachmentsRepository,
    )
    attachmentMapper = new AttachmentMapper()
    sellerProfileMapper = new SellerProfileMapper(attachmentMapper)
    sut = new EditSellerUseCase(
      inMemorySellersRepository,
      inMemoryAttachmentsRepository,
      fakeHasher,
      fakeHasher,
      sellerProfileFactory,
      sellerProfileMapper,
    )
  })

  it('should be able to edit a seller without avatar', async () => {
    const seller = makeSeller()
    await inMemorySellersRepository.create(seller)

    const result = await sut.execute({
      sellerId: seller.id.toString(),
      name: 'Seller 2',
      phone: '123456789',
      email: 'seller2@example.com',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(inMemorySellersRepository.items).toHaveLength(1)
      expect(inMemorySellersRepository.items[0]).toMatchObject({
        name: 'Seller 2',
        phone: '123456789',
        email: 'seller2@example.com',
        avatarId: null,
      })
      expect(Object.keys(result.value)).toEqual(['sellerProfile'])
      expect(result.value.sellerProfile).toMatchObject({
        sellerId: inMemorySellersRepository.items[0].id.toString(),
        name: 'Seller 2',
        phone: '123456789',
        email: 'seller2@example.com',
        avatar: null,
      })
    }
  })

  it('should be able to edit a seller and change avatar', async () => {
    const seller = makeSeller({
      name: 'Seller 1',
      phone: '987654321',
      email: 'seller1@example.com',
      avatarId: null,
    })
    await inMemorySellersRepository.create(seller)

    const avatarId = UniqueEntityID.create({
      value: 'new-attachment-id',
    })
    const avatar = makeAttachment({}, avatarId)
    await inMemoryAttachmentsRepository.create(avatar)

    const result = await sut.execute({
      sellerId: seller.id.toString(),
      name: 'Seller 2',
      phone: '123456789',
      email: 'seller2@example.com',
      avatarId: avatarId.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(inMemorySellersRepository.items).toHaveLength(1)
      expect(inMemorySellersRepository.items[0]).toMatchObject({
        name: 'Seller 2',
        phone: '123456789',
        email: 'seller2@example.com',
      })
      expect(inMemorySellersRepository.items[0].avatarId?.toString()).toBe(
        avatarId.toString(),
      )
      expect(Object.keys(result.value)).toEqual(['sellerProfile'])
      expect(result.value.sellerProfile).toMatchObject({
        sellerId: inMemorySellersRepository.items[0].id.toString(),
        name: 'Seller 2',
        phone: '123456789',
        email: 'seller2@example.com',
        avatar: { id: avatar.id.toString(), url: avatar.url },
      })
    }
  })

  it('should be able to edit a seller and change password', async () => {
    const seller = makeSeller({ password: await fakeHasher.hash('password') })
    await inMemorySellersRepository.create(seller)

    const result = await sut.execute({
      sellerId: seller.id.toString(),
      name: 'Seller 2',
      phone: '123456789',
      email: 'seller2@example.com',
      password: 'password',
      newPassword: 'password2',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(inMemorySellersRepository.items).toHaveLength(1)
      expect(inMemorySellersRepository.items[0]).toMatchObject({
        name: 'Seller 2',
        phone: '123456789',
        email: 'seller2@example.com',
      })
      expect(
        await fakeHasher.compare(
          'password2',
          inMemorySellersRepository.items[0].password,
        ),
      ).toBe(true)
      expect(Object.keys(result.value)).toEqual(['sellerProfile'])
      expect(result.value.sellerProfile).toMatchObject({
        sellerId: inMemorySellersRepository.items[0].id.toString(),
        name: 'Seller 2',
        phone: '123456789',
        email: 'seller2@example.com',
        avatar: null,
      })
    }
  })

  it('should return ResourceNotFoundError if seller does not exist', async () => {
    const result = await sut.execute({
      sellerId: 'non-existent-seller-id',
      name: 'Seller 2',
      phone: '123456789',
      email: 'seller2@example.com',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return WrongCredentialsError if newPassword is passed but password is undefined', async () => {
    const seller = makeSeller({
      name: 'Seller 1',
      phone: '123456789',
      email: 'seller1@example.com',
    })
    await inMemorySellersRepository.create(seller)

    const result = await sut.execute({
      sellerId: seller.id.toString(),
      name: 'Seller 2',
      phone: '987654321',
      email: 'seller2@example.com',
      newPassword: 'password2',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(WrongCredentialsError)
      expect(inMemorySellersRepository.items[0].name).toBe('Seller 1')
      expect(inMemorySellersRepository.items[0].phone).toBe('123456789')
      expect(inMemorySellersRepository.items[0].email).toBe(
        'seller1@example.com',
      )
      expect(inMemorySellersRepository.items[0].avatarId).toBeNull()
    }
  })

  it('should return NewPasswordMustBeDifferentError if newPassword is passed and is equal to password', async () => {
    const seller = makeSeller({
      name: 'Seller 1',
      phone: '123456789',
      email: 'seller1@example.com',
      password: await fakeHasher.hash('password'),
    })
    await inMemorySellersRepository.create(seller)

    const result = await sut.execute({
      sellerId: seller.id.toString(),
      name: 'Seller 2',
      phone: '987654321',
      email: 'seller2@example.com',
      password: 'password',
      newPassword: 'password',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NewPasswordMustBeDifferentError)
      expect(inMemorySellersRepository.items[0].name).toBe('Seller 1')
      expect(inMemorySellersRepository.items[0].phone).toBe('123456789')
      expect(inMemorySellersRepository.items[0].email).toBe(
        'seller1@example.com',
      )
      expect(inMemorySellersRepository.items[0].avatarId).toBeNull()
      expect(
        await fakeHasher.compare(
          'password',
          inMemorySellersRepository.items[0].password,
        ),
      ).toBe(true)
    }
  })

  it('should return WrongCredentialsError if newPassword is passed and password passed is different from current password', async () => {
    const seller = makeSeller({
      name: 'Seller 1',
      phone: '123456789',
      email: 'seller1@example.com',
      password: await fakeHasher.hash('password'),
    })
    await inMemorySellersRepository.create(seller)

    const result = await sut.execute({
      sellerId: seller.id.toString(),
      name: 'Seller 2',
      phone: '987654321',
      email: 'seller2@example.com',
      password: 'wrong-password',
      newPassword: 'password2',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(WrongCredentialsError)
      expect(inMemorySellersRepository.items[0].name).toBe('Seller 1')
      expect(inMemorySellersRepository.items[0].phone).toBe('123456789')
      expect(inMemorySellersRepository.items[0].email).toBe(
        'seller1@example.com',
      )
      expect(inMemorySellersRepository.items[0].avatarId).toBeNull()
      expect(
        await fakeHasher.compare(
          'password',
          inMemorySellersRepository.items[0].password,
        ),
      ).toBe(true)
    }
  })

  it('should return SellerEmailAlreadyExistsError if email is different and already has another seller with the same email', async () => {
    const seller1 = makeSeller({
      name: 'Seller 1',
      phone: '123456789',
      email: 'seller1@example.com',
    })
    await inMemorySellersRepository.create(seller1)
    const seller2 = makeSeller({ email: 'seller2@example.com' })
    await inMemorySellersRepository.create(seller2)

    const result = await sut.execute({
      sellerId: seller1.id.toString(),
      name: 'Seller 2',
      phone: '987654321',
      email: 'seller2@example.com',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(SellerEmailAlreadyExistsError)
      expect(inMemorySellersRepository.items[0].name).toBe('Seller 1')
      expect(inMemorySellersRepository.items[0].phone).toBe('123456789')
      expect(inMemorySellersRepository.items[0].email).toBe(
        'seller1@example.com',
      )
      expect(inMemorySellersRepository.items[0].avatarId).toBeNull()
    }
  })

  it('should return SellerPhoneAlreadyExistsError if phone is different and already has another seller with the same phone', async () => {
    const seller1 = makeSeller({
      name: 'Seller 1',
      phone: '123456789',
      email: 'seller1@example.com',
    })
    await inMemorySellersRepository.create(seller1)
    const seller2 = makeSeller({ phone: '987654321' })
    await inMemorySellersRepository.create(seller2)

    const result = await sut.execute({
      sellerId: seller1.id.toString(),
      name: 'Seller 2',
      phone: '987654321',
      email: 'seller2@example.com',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(SellerPhoneAlreadyExistsError)
      expect(inMemorySellersRepository.items[0].name).toBe('Seller 1')
      expect(inMemorySellersRepository.items[0].phone).toBe('123456789')
      expect(inMemorySellersRepository.items[0].email).toBe(
        'seller1@example.com',
      )
      expect(inMemorySellersRepository.items[0].avatarId).toBeNull()
    }
  })

  it('should return ResourceNotFoundError if new avatarId is not found', async () => {
    const seller = makeSeller({
      name: 'Seller 1',
      phone: '123456789',
      email: 'seller1@example.com',
    })
    await inMemorySellersRepository.create(seller)
    const avatarId = UniqueEntityID.create({
      value: 'non-existent-attachment-id',
    })

    const result = await sut.execute({
      sellerId: seller.id.toString(),
      name: 'Seller 2',
      phone: '987654321',
      email: 'seller2@example.com',
      avatarId: avatarId.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
      expect(inMemorySellersRepository.items[0].name).toBe('Seller 1')
      expect(inMemorySellersRepository.items[0].phone).toBe('123456789')
      expect(inMemorySellersRepository.items[0].email).toBe(
        'seller1@example.com',
      )
      expect(inMemorySellersRepository.items[0].avatarId).toBeNull()
    }
  })
})
