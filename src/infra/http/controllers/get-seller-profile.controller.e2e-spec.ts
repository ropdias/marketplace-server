import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { DatabaseModule } from '@/infra/database/database.module'
import { SellerFactory } from 'test/factories/make-seller'
import type { Server } from 'http'
import { createSellerAndLoginWithCookie } from 'test/utils/create-seller-and-login'
import { JwtService } from '@nestjs/jwt'
import { sellerProfileResponseSchema } from '../presenters/seller-profile-presenter'
import cookieParser from 'cookie-parser'

describe('Get Seller Profile (E2E)', () => {
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
    app.use(cookieParser())

    httpServer = app.getHttpServer() as Server
    jwtService = moduleRef.get(JwtService)

    sellerFactory = moduleRef.get(SellerFactory)

    await app.init()
  })

  test('[GET] /sellers/me', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const response = await request(httpServer)
      .get('/sellers/me')
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(200)
    expect(sellerProfileResponseSchema.parse(response.body)).toBeTruthy()
    expect(response.body).toMatchObject({
      seller: {
        id: seller.id.toString(),
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        avatar: null,
      },
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
