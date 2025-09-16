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

describe('Update the current seller​ (E2E)', () => {
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

  test('[PUT] /sellers - it should be possible to update seller', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
      {
        email: 'johndoe@example.com',
        name: 'John Doe',
        password: 'password123',
        phone: '9876543210',
      },
    )

    const avatar = await attachmentFactory.makePrismaAttachment()

    const response = await request(httpServer)
      .put('/sellers')
      .set('Cookie', cookieString)
      .send({
        name: 'John Doe Updated',
        email: 'johndoeupdated@example.com',
        phone: '1234567890',
        avatarId: avatar.id.toString(),
        password: 'password123',
        newPassword: 'newpassword123',
      })

    expect(response.statusCode).toBe(200)
    expect(sellerProfileResponseSchema.parse(response.body)).toBeTruthy()
    expect(response.body).toMatchObject({
      seller: {
        id: seller.id.toString(),
        name: 'John Doe Updated',
        email: 'johndoeupdated@example.com',
        phone: '1234567890',
        avatar: { id: avatar.id.toString(), url: avatar.url },
      },
    })
  })

  test('[PUT] /sellers - it should be possible to update seller with minimal data', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
      {
        email: 'johndoe2@example.com',
        name: 'John Doe',
        password: 'password123',
        phone: '98765432102',
      },
    )

    const response = await request(httpServer)
      .put('/sellers')
      .set('Cookie', cookieString)
      .send({
        name: 'John Doe Updated',
        email: 'johndoe2@example.com',
        phone: '98765432102',
      })

    expect(response.statusCode).toBe(200)
    expect(sellerProfileResponseSchema.parse(response.body)).toBeTruthy()
    expect(response.body).toMatchObject({
      seller: {
        id: seller.id.toString(),
        name: 'John Doe Updated',
        email: 'johndoe2@example.com',
        phone: '98765432102',
        avatar: null,
      },
    })
  })

  test('[PUT] /sellers - should return 401 when no authentication cookie is provided', async () => {
    const response = await request(httpServer).put('/sellers')

    expect(response.statusCode).toBe(401)
  })

  test('[PUT] /sellers - should return 401 when invalid authentication cookie is provided', async () => {
    const response = await request(httpServer)
      .put('/sellers')
      .set('Cookie', 'access_token=invalid-token')

    expect(response.statusCode).toBe(401)
  })

  test('[PUT] /sellers - should return 400 when newPassword is not different', async () => {
    const { cookieString } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
      {
        email: 'johndoe3@example.com',
        name: 'John Doe',
        password: 'password123',
        phone: '98765432103',
      },
    )

    const response = await request(httpServer)
      .put('/sellers')
      .set('Cookie', cookieString)
      .send({
        name: 'John Doe Updated',
        email: 'johndoe3@example.com',
        phone: '12345678903',
        password: 'password123',
        newPassword: 'password123',
      })

    expect(response.statusCode).toBe(400)
    expect(response.body).toMatchObject({
      error: 'Bad Request',
      message: 'The newPassword must be different.',
    })
  })

  test('[PUT] /sellers - should return 403 when password is different', async () => {
    const { cookieString } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
      {
        email: 'johndoe4@example.com',
        name: 'John Doe',
        password: 'password123',
        phone: '98765432104',
      },
    )

    const response = await request(httpServer)
      .put('/sellers')
      .set('Cookie', cookieString)
      .send({
        name: 'John Doe Updated',
        email: 'johndoe4@example.com',
        phone: '12345678904',
        password: 'wrong-password',
        newPassword: 'new-password123',
      })

    expect(response.statusCode).toBe(403)
    expect(response.body).toMatchObject({
      error: 'Forbidden',
      message: 'Invalid credentials.',
    })
  })

  test('[PUT] /sellers - should return 404 when seller or avatar is not found', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
      {
        email: 'johndoe5@example.com',
        name: 'John Doe',
        password: 'password123',
        phone: '98765432105',
      },
    )

    const response = await request(httpServer)
      .put('/sellers')
      .set('Cookie', cookieString)
      .send({
        name: 'John Doe Updated',
        email: 'johndoe5@example.com',
        phone: '12345678905',
        avatarId: 'non-existent-avatar-id',
      })

    expect(response.statusCode).toBe(404)
    expect(response.body).toMatchObject({
      error: 'Not Found',
      message: 'Avatar not found.',
    })

    // Delete the seller from the database to simulate not found
    await prisma.seller.delete({
      where: { id: seller.id.toString() },
    })

    const response2 = await request(httpServer)
      .put('/sellers')
      .set('Cookie', cookieString)
      .send({
        name: 'John Doe Updated',
        email: 'johndoe5@example.com',
        phone: '12345678905',
      })

    expect(response2.statusCode).toBe(404)
    expect(response2.body).toMatchObject({
      error: 'Not Found',
      message: 'Seller not found.',
    })
  })

  test('[PUT] /sellers - should return 409 when the email or phone already exists', async () => {
    await createSellerAndLoginWithCookie(sellerFactory, jwtService, {
      email: 'johndoe6@example.com',
      name: 'John Doe',
      password: 'password123',
      phone: '98765432106',
    })

    const { cookieString } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
      {
        email: 'johndoe7@example.com',
        name: 'John Doe',
        password: 'password123',
        phone: '98765432107',
      },
    )

    const response = await request(httpServer)
      .put('/sellers')
      .set('Cookie', cookieString)
      .send({
        name: 'John Doe Updated',
        email: 'johndoe6@example.com',
        phone: '98765432107',
      })

    expect(response.statusCode).toBe(409)
    expect(response.body).toMatchObject({
      error: 'Conflict',
      message: 'The email already exists.',
    })

    const response2 = await request(httpServer)
      .put('/sellers')
      .set('Cookie', cookieString)
      .send({
        name: 'John Doe Updated',
        email: 'johndoe7@example.com',
        phone: '98765432106',
      })

    expect(response2.statusCode).toBe(409)
    expect(response2.body).toMatchObject({
      error: 'Conflict',
      message: 'The phone already exists.',
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
