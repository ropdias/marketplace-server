/* eslint-disable @typescript-eslint/require-await */
import { Encrypter } from '@/domain/marketplace/application/cryptography/encrypter'

export class FakeEncrypter implements Encrypter {
  async encrypt(payload: Record<string, unknown>): Promise<string> {
    return JSON.stringify(payload)
  }
}
