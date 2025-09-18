import { FakeHasher } from 'test/cryptography/fake-hasher'
import { FakeEncrypter } from 'test/cryptography/fake-encrypter'
import { InMemorySellersRepository } from 'test/repositories/in-memory-sellers-repository'
import { AuthenticateSellerUseCase } from './authenticate-seller'
import { makeSeller } from 'test/factories/make-seller'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'

let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let inMemorySellersRepository: InMemorySellersRepository
let fakeHasher: FakeHasher
let fakeEncrypter: FakeEncrypter

let sut: AuthenticateSellerUseCase

describe('Authenticate Seller', () => {
  beforeEach(() => {
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    inMemorySellersRepository = new InMemorySellersRepository(
      inMemoryAttachmentsRepository,
    )
    fakeHasher = new FakeHasher()
    fakeEncrypter = new FakeEncrypter()

    sut = new AuthenticateSellerUseCase(
      inMemorySellersRepository,
      fakeHasher,
      fakeEncrypter,
    )
  })

  it('should be able to authenticate a seller', async () => {
    const seller = makeSeller({
      email: 'johndoe@example.com',
      password: await fakeHasher.hash('123456'),
    })

    await inMemorySellersRepository.create(seller)

    const result = await sut.execute({
      email: 'johndoe@example.com',
      password: '123456',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.accessToken).toEqual(expect.any(String))
    }
  })
})
