import { Module } from '@nestjs/common'

import { HashComparator } from '@/domain/marketplace/application/cryptography/hash-comparator'
import { HashGenerator } from '@/domain/marketplace/application/cryptography/hash-generator'

import { BcryptHasher } from './bcrypt-hasher'

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
  ],
  exports: [HashComparator, HashGenerator],
})
export class CryptographyModule {}
