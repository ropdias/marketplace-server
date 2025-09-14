import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { hash } from 'bcryptjs'
import { DatabaseModule } from '@/infra/database/database.module'
import { SellerFactory } from 'test/factories/make-seller'
import type { Server } from 'http'

describe('Sign Out (E2E)', () => {
  let app: INestApplication
  let httpServer: Server
  let sellerFactory: SellerFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [SellerFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    httpServer = app.getHttpServer() as Server

    sellerFactory = moduleRef.get(SellerFactory)

    await app.init()
  })

  test('[POST] /sign-out - should clear cookie and return success message', async () => {
    await sellerFactory.makePrismaSeller({
      email: 'johndoe@example.com',
      password: await hash('123456', 10),
    })

    const loginResponse = await request(httpServer)
      .post('/sellers/sessions')
      .send({
        email: 'johndoe@example.com',
        password: '123456',
      })

    const cookies = loginResponse.get('Set-Cookie')
    expect(cookies).toBeDefined()

    const signOutResponse = await request(httpServer)
      .post('/sign-out')
      .set('Cookie', cookies!)

    expect(signOutResponse.statusCode).toBe(200)
    expect(signOutResponse.body).toEqual({
      message: 'The user was successfully signed out.',
    })

    // Check if the cookie was cleared (Set-Cookie with empty or expired value)
    expect(signOutResponse.headers['set-cookie']).toBeDefined()
    const clearCookieHeader = signOutResponse.headers['set-cookie'][0]
    expect(clearCookieHeader).toContain('access_token=')
    // Check if the cookie is being cleared (without value or with expires in the past)
    expect(/access_token=.*;.*(Expires|Max-Age)/.test(clearCookieHeader)).toBe(
      true,
    )
  })

  test('[POST] /sign-out - should work even without authentication cookie', async () => {
    const response = await request(httpServer).post('/sign-out')

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      message: 'The user was successfully signed out.',
    })

    // Check if the cookie is being cleared (without value or with expires in the past)
    expect(response.headers['set-cookie']).toBeDefined()
    const clearCookieHeader = response.headers['set-cookie'][0]
    expect(clearCookieHeader).toContain('access_token=')
    expect(/access_token=.*;.*(Expires|Max-Age)/.test(clearCookieHeader)).toBe(
      true,
    )
  })

  test('[POST] /sign-out - should work with invalid/expired cookie', async () => {
    const response = await request(httpServer)
      .post('/sign-out')
      .set('Cookie', 'access_token=invalid_token_here')

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      message: 'The user was successfully signed out.',
    })

    // Check if the cookie was cleared (Set-Cookie with empty or expired value)
    expect(response.headers['set-cookie']).toBeDefined()
    const clearCookieHeader = response.headers['set-cookie'][0]
    expect(clearCookieHeader).toContain('access_token=')
    expect(/access_token=.*;.*(Expires|Max-Age)/.test(clearCookieHeader)).toBe(
      true,
    )
  })

  afterAll(async () => {
    await app.close()
  })
})
