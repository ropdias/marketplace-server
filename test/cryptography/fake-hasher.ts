/* eslint-disable @typescript-eslint/require-await */
import { HashComparator } from '@/domain/marketplace/application/cryptography/hash-comparator'
import { HashGenerator } from '@/domain/marketplace/application/cryptography/hash-generator'

export class FakeHasher implements HashGenerator, HashComparator {
  async hash(plain: string): Promise<string> {
    return plain.concat('-hashed')
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return plain.concat('-hashed') === hash
  }
}
