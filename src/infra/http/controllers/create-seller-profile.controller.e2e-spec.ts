import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { DatabaseModule } from '@/infra/database/database.module'
import { AttachmentFactory } from 'test/factories/make-attachment'
import type { Server } from 'http'
import { sellerProfileResponseSchema } from '../presenters/seller-profile-presenter'
import cookieParser from 'cookie-parser'

describe('Create a new seller (E2E)', () => {
  let app: INestApplication
  let httpServer: Server
  let attachmentFactory: AttachmentFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AttachmentFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    app.use(cookieParser())

    httpServer = app.getHttpServer() as Server

    attachmentFactory = moduleRef.get(AttachmentFactory)

    await app.init()
  })

  test('[POST] /sellers - should create a seller profile without avatar', async () => {
    const response = await request(httpServer).post('/sellers').send({
      name: 'John Doe',
      email: 'johndoe@example.com',
      phone: '1234567890',
      password: '123456',
      passwordConfirmation: '123456',
      avatarId: null,
    })

    expect(response.statusCode).toBe(201)
    expect(sellerProfileResponseSchema.parse(response.body)).toBeTruthy()
    expect(response.body).toMatchObject({
      seller: {
        name: 'John Doe',
        email: 'johndoe@example.com',
        phone: '1234567890',
        avatar: null,
      },
    })
  })

  test('[POST] /sellers - should return seller profile with avatar', async () => {
    const avatar = await attachmentFactory.makePrismaAttachment()

    const response = await request(httpServer).post('/sellers').send({
      name: 'John Doe',
      email: 'johndoe2@example.com',
      phone: '12345678902',
      password: '123456',
      passwordConfirmation: '123456',
      avatarId: avatar.id.toString(),
    })

    expect(response.statusCode).toBe(201)
    expect(sellerProfileResponseSchema.parse(response.body)).toBeTruthy()
    expect(response.body).toMatchObject({
      seller: {
        name: 'John Doe',
        email: 'johndoe2@example.com',
        phone: '12345678902',
        avatar: { id: avatar.id.toString(), url: avatar.url },
      },
    })
  })

  test('[POST] /sellers - should return 400 if password is different', async () => {
    const response = await request(httpServer).post('/sellers').send({
      name: 'John Doe',
      email: 'johndoe3@example.com',
      phone: '12345678903',
      password: '123456',
      passwordConfirmation: '1234567',
      avatarId: null,
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toMatchObject({
      error: 'Bad Request',
      message: 'Password is different.',
    })
  })

  test('[POST] /sellers - should return 404 if avatar is not found', async () => {
    const response = await request(httpServer).post('/sellers').send({
      name: 'John Doe',
      email: 'johndoe4@example.com',
      phone: '12345678904',
      password: '123456',
      passwordConfirmation: '123456',
      avatarId: 'non-existent-avatar-id',
    })

    expect(response.statusCode).toBe(404)
    expect(response.body).toMatchObject({
      error: 'Not Found',
      message: 'The avatar was not found.',
    })
  })

  test('[POST] /sellers - should return 409 if email or phone already exists', async () => {
    const response = await request(httpServer).post('/sellers').send({
      name: 'John Doe',
      email: 'johndoe6@example.com',
      phone: '12345678906',
      password: '123456',
      passwordConfirmation: '123456',
      avatarId: null,
    })

    expect(response.statusCode).toBe(201)

    const response2 = await request(httpServer).post('/sellers').send({
      name: 'John Doe',
      email: 'johndoe6@example.com',
      phone: '12345678907',
      password: '123456',
      passwordConfirmation: '123456',
      avatarId: null,
    })

    expect(response2.statusCode).toBe(409)
    expect(response2.body).toMatchObject({
      error: 'Conflict',
      message: 'The email already exists.',
    })

    const response3 = await request(httpServer).post('/sellers').send({
      name: 'John Doe',
      email: 'johndoe7@example.com',
      phone: '12345678906',
      password: '123456',
      passwordConfirmation: '123456',
      avatarId: null,
    })

    expect(response3.statusCode).toBe(409)
    expect(response3.body).toMatchObject({
      error: 'Conflict',
      message: 'The phone already exists.',
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
