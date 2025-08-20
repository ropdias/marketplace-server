import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { HashComparator } from '../cryptography/hash-comparator'
import { WrongCredentialsError } from './errors/wrong-credentials-error'
import { SellersRepository } from '../repositories/sellers-repository'
import { Encrypter } from '../cryptography/encrypter'

interface AuthenticateSellerUseCaseRequest {
  email: string
  password: string
}

type AuthenticateSellerUseCaseResponse = Either<
  WrongCredentialsError,
  {
    accessToken: string
  }
>

@Injectable()
export class AuthenticateSellerUseCase {
  constructor(
    private sellersRepository: SellersRepository,
    private hashComparator: HashComparator,
    private encrypter: Encrypter,
  ) {}

  async execute({
    email,
    password,
  }: AuthenticateSellerUseCaseRequest): Promise<AuthenticateSellerUseCaseResponse> {
    const seller = await this.sellersRepository.findByEmail(email)

    if (!seller) {
      return left(new WrongCredentialsError())
    }

    const isPasswordValid = await this.hashComparator.compare(
      password,
      seller.password,
    )

    if (!isPasswordValid) {
      return left(new WrongCredentialsError())
    }

    const accessToken = await this.encrypter.encrypt({
      sub: seller.id.toString(),
    })

    return right({
      accessToken,
    })
  }
}
