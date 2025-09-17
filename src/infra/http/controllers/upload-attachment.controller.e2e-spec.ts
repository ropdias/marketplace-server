import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { DatabaseModule } from '@/infra/database/database.module'
import { SellerFactory } from 'test/factories/make-seller'
import type { Server } from 'http'
import { createSellerAndLoginWithCookie } from 'test/utils/create-seller-and-login'
import { JwtService } from '@nestjs/jwt'
import cookieParser from 'cookie-parser'
import { attachmentsResponseSchema } from '../presenters/attachment-presenter'

describe('Fetch all categories (E2E)', () => {
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

  test('[POST] /attachments - should be able to upload attachments', async () => {
    const { cookieString } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const response = await request(httpServer)
      .post('/attachments')
      .set('Cookie', cookieString)
      .attach('files', './test/e2e/sample-upload.jpeg')
      .attach('files', './test/e2e/sample-upload-2.jpg')

    expect(response.statusCode).toBe(201)
    expect(attachmentsResponseSchema.parse(response.body)).toBeTruthy()
    const parsedBody = attachmentsResponseSchema.parse(response.body)
    expect(parsedBody.attachments).toHaveLength(2)
    console.log(parsedBody)
  })

  test('[POST] /attachments - should return 401 when no authentication cookie is provided', async () => {
    const response = await request(httpServer).post('/attachments')

    expect(response.statusCode).toBe(401)
  })

  test('[POST] /attachments - should return 401 when invalid authentication cookie is provided', async () => {
    const response = await request(httpServer)
      .post('/attachments')
      .set('Cookie', 'access_token=invalid-token')

    expect(response.statusCode).toBe(401)
  })

  afterAll(async () => {
    await app.close()
  })
})
