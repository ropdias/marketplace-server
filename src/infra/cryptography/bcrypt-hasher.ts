import { hash, compare } from 'bcryptjs'

import { HashGenerator } from '@/domain/marketplace/application/cryptography/hash-generator'
import { HashComparator } from '@/domain/marketplace/application/cryptography/hash-comparator'

export class BcryptHasher implements HashGenerator, HashComparator {
  private HASH_SALT_LENGTH = 10

  hash(plain: string): Promise<string> {
    return hash(plain, this.HASH_SALT_LENGTH)
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return compare(plain, hash)
  }
}
