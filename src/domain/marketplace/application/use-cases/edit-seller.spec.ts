import { InMemorySellersRepository } from 'test/repositories/in-memory-sellers-repository'
import { SellerProfileFactory } from '../factories/seller-profile-factory'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'
import { SellerProfileMapper } from '../mappers/seller-profile-mapper'
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
let sut: EditSellerUseCase

describe('Edit Seller', () => {
  beforeEach(() => {
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    inMemorySellersRepository = new InMemorySellersRepository(
      inMemoryAttachmentsRepository,
    )
    fakeHasher = new FakeHasher()
    sut = new EditSellerUseCase(
      inMemorySellersRepository,
      inMemoryAttachmentsRepository,
      fakeHasher,
      fakeHasher,
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
      const editedSeller = inMemorySellersRepository.items[0]
      const sellerProfile = SellerProfileFactory.create({
        seller: editedSeller,
        avatar: null,
      })
      const sellerProfileDTO = SellerProfileMapper.toDTO(sellerProfile)
      expect(inMemorySellersRepository.items).toHaveLength(1)
      expect(result.value.sellerProfile).toMatchObject(sellerProfileDTO)
      expect(result.value.sellerProfile.name).toBe('Seller 2')
      expect(result.value.sellerProfile.phone).toBe('123456789')
      expect(result.value.sellerProfile.email).toBe('seller2@example.com')
      expect(result.value.sellerProfile.avatar).toBeNull()
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
    await inMemoryAttachmentsRepository.createMany([avatar])

    const result = await sut.execute({
      sellerId: seller.id.toString(),
      name: 'Seller 2',
      phone: '123456789',
      email: 'seller2@example.com',
      avatarId: avatarId.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const editedSeller = inMemorySellersRepository.items[0]
      const sellerProfile = SellerProfileFactory.create({
        seller: editedSeller,
        avatar,
      })
      const sellerProfileDTO = SellerProfileMapper.toDTO(sellerProfile)
      expect(inMemorySellersRepository.items).toHaveLength(1)
      expect(result.value.sellerProfile).toMatchObject(sellerProfileDTO)
      expect(result.value.sellerProfile.name).toBe('Seller 2')
      expect(result.value.sellerProfile.phone).toBe('123456789')
      expect(result.value.sellerProfile.email).toBe('seller2@example.com')
      expect(result.value.sellerProfile.avatar?.id).toBe(avatar.id.toString())
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
      const editedSeller = inMemorySellersRepository.items[0]
      const sellerProfile = SellerProfileFactory.create({
        seller: editedSeller,
        avatar: null,
      })
      const sellerProfileDTO = SellerProfileMapper.toDTO(sellerProfile)
      expect(inMemorySellersRepository.items).toHaveLength(1)
      expect(result.value.sellerProfile).toMatchObject(sellerProfileDTO)
      expect(result.value.sellerProfile.name).toBe('Seller 2')
      expect(result.value.sellerProfile.phone).toBe('123456789')
      expect(result.value.sellerProfile.email).toBe('seller2@example.com')
      expect(result.value.sellerProfile.avatar).toBeNull()
      expect(
        await fakeHasher.compare(
          'password2',
          inMemorySellersRepository.items[0].password,
        ),
      ).toBe(true)
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
    }
  })
})
