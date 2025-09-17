import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { DatabaseModule } from '@/infra/database/database.module'
import { SellerFactory } from 'test/factories/make-seller'
import { AttachmentFactory } from 'test/factories/make-attachment'
import type { Server } from 'http'
import { createSellerAndLoginWithCookie } from 'test/utils/create-seller-and-login'
import { JwtService } from '@nestjs/jwt'
import { sellerProfileResponseSchema } from '../presenters/seller-profile-presenter'
import cookieParser from 'cookie-parser'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('Get Seller Profile (E2E)', () => {
  let app: INestApplication
  let httpServer: Server
  let sellerFactory: SellerFactory
  let attachmentFactory: AttachmentFactory
  let jwtService: JwtService
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [SellerFactory, AttachmentFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    app.use(cookieParser())

    httpServer = app.getHttpServer() as Server
    jwtService = moduleRef.get(JwtService)
    prisma = moduleRef.get(PrismaService)

    sellerFactory = moduleRef.get(SellerFactory)
    attachmentFactory = moduleRef.get(AttachmentFactory)

    await app.init()
  })

  test('[GET] /sellers/me - should return seller profile without avatar', async () => {
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

  test('[GET] /sellers/me - should return seller profile with avatar', async () => {
    const avatar = await attachmentFactory.makePrismaAttachment()

    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
      { email: 'sellerwithavatar@test.com' },
    )

    // Update the seller in the database to have an avatar
    await prisma.seller.update({
      where: { id: seller.id.toString() },
      data: { avatarId: avatar.id.toString() },
    })

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
        avatar: {
          id: avatar.id.toString(),
        },
      },
    })
  })

  test('[GET] /sellers/me - should return 401 when no authentication cookie is provided', async () => {
    const response = await request(httpServer).get('/sellers/me')

    expect(response.statusCode).toBe(401)
  })

  test('[GET] /sellers/me - should return 401 when invalid authentication cookie is provided', async () => {
    const response = await request(httpServer)
      .get('/sellers/me')
      .set('Cookie', 'access_token=invalid-token')

    expect(response.statusCode).toBe(401)
  })

  test('[GET] /sellers/me - should return 404 when seller is not found', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
      { email: 'sellertodelete@test.com' },
    )

    // Delete the seller from the database to simulate not found
    await prisma.seller.delete({
      where: { id: seller.id.toString() },
    })

    const response = await request(httpServer)
      .get('/sellers/me')
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(404)
  })

  afterAll(async () => {
    await app.close()
  })
})
