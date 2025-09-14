import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { hash } from 'bcryptjs'
import { DatabaseModule } from '@/infra/database/database.module'
import { SellerFactory } from 'test/factories/make-seller'
import type { Server } from 'http'

describe('Authenticate (E2E)', () => {
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

  test('[POST] /sellers/sessions', async () => {
    await sellerFactory.makePrismaSeller({
      email: 'johndoe@example.com',
      password: await hash('123456', 10),
    })

    const response = await request(httpServer).post('/sellers/sessions').send({
      email: 'johndoe@example.com',
      password: '123456',
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      message: 'Authentication successful',
    })
    expect(response.headers['set-cookie']).toBeDefined()
    expect(response.headers['set-cookie'][0]).toContain('access_token=')
  })

  afterAll(async () => {
    await app.close()
  })
})
