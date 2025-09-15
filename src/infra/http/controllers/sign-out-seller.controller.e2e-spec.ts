import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { DatabaseModule } from '@/infra/database/database.module'
import { SellerFactory } from 'test/factories/make-seller'
import type { Server } from 'http'
import { createSellerAndLoginWithCookie } from 'test/utils/create-seller-and-login'
import { JwtService } from '@nestjs/jwt'

describe('Sign Out Seller (E2E)', () => {
  let app: INestApplication
  let httpServer: Server
  let sellerFactory: SellerFactory
  let jwtService: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [SellerFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    httpServer = app.getHttpServer() as Server
    jwtService = moduleRef.get(JwtService)

    sellerFactory = moduleRef.get(SellerFactory)

    await app.init()
  })

  test('[POST] /sign-out - should clear cookie and return success message', async () => {
    const { cookieString } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const response = await request(httpServer)
      .post('/sign-out')
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      message: 'The user was successfully signed out.',
    })

    // Check if the cookie was cleared (Set-Cookie with empty or expired value)
    expect(response.headers['set-cookie']).toBeDefined()
    const clearCookieHeader = response.headers['set-cookie'][0]
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
