import request from 'supertest'
import { hash } from 'bcryptjs'
import { SellerFactory } from '../factories/make-seller'
import type { Server } from 'http'
import { Seller } from '@/domain/marketplace/enterprise/entities/seller'

export async function createSellerAndLogin(
  httpServer: Server,
  sellerFactory: SellerFactory,
  email = 'johndoe@example.com',
  password = '123456',
): Promise<{ seller: Seller; cookies: string[] }> {
  const seller = await sellerFactory.makePrismaSeller({
    email,
    password: await hash(password, 10),
  })

  const loginResponse = await request(httpServer)
    .post('/sellers/sessions')
    .send({ email, password })
    .expect(200)

  const cookies = loginResponse.get('Set-Cookie')
  if (!cookies) throw new Error('Login did not return cookies')

  return { seller, cookies }
}
