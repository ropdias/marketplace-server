import { Module } from '@nestjs/common'

import { HashComparator } from '@/domain/marketplace/application/cryptography/hash-comparator'
import { HashGenerator } from '@/domain/marketplace/application/cryptography/hash-generator'

import { BcryptHasher } from './bcrypt-hasher'
import { Encrypter } from '@/domain/marketplace/application/cryptography/encrypter'
import { JwtEncrypter } from './jwt-encrypter'

@Module({
  providers: [
    {
      provide: HashComparator,
      useClass: BcryptHasher,
    },
    {
      provide: HashGenerator,
      useClass: BcryptHasher,
    },
    {
      provide: Encrypter,
      useClass: JwtEncrypter,
    },
  ],
  exports: [HashComparator, HashGenerator, Encrypter],
})
export class CryptographyModule {}
