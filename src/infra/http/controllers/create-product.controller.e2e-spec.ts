import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { DatabaseModule } from '@/infra/database/database.module'
import { AttachmentFactory } from 'test/factories/make-attachment'
import type { Server } from 'http'
import cookieParser from 'cookie-parser'
import { ProductFactory } from 'test/factories/make-product'
import { createSellerAndLoginWithCookie } from 'test/utils/create-seller-and-login'
import { SellerFactory } from 'test/factories/make-seller'
import { JwtService } from '@nestjs/jwt'
import { CategoryFactory } from 'test/factories/make-category'
import { productDetailsResponseSchema } from '../presenters/product-details-presenter'
import { faker } from '@faker-js/faker'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('Create a product to sell (E2E)', () => {
  let app: INestApplication
  let httpServer: Server
  let sellerFactory: SellerFactory
  let jwtService: JwtService
  let categoryFactory: CategoryFactory
  let attachmentFactory: AttachmentFactory
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        AttachmentFactory,
        ProductFactory,
        SellerFactory,
        CategoryFactory,
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    app.use(cookieParser())

    httpServer = app.getHttpServer() as Server

    sellerFactory = moduleRef.get(SellerFactory)
    jwtService = moduleRef.get(JwtService)
    categoryFactory = moduleRef.get(CategoryFactory)
    attachmentFactory = moduleRef.get(AttachmentFactory)
    prisma = moduleRef.get(PrismaService)

    await app.init()
  })

  test('[POST] /products - should create a product with images', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const category = await categoryFactory.makePrismaCategory()
    const attachment1 = await attachmentFactory.makePrismaAttachment()
    const attachment2 = await attachmentFactory.makePrismaAttachment()

    const response = await request(httpServer)
      .post('/products')
      .set('Cookie', cookieString)
      .send({
        title: 'New Product',
        description: 'Product description',
        priceInCents: 1000,
        categoryId: category.id.toString(),
        attachmentsIds: [attachment1.id.toString(), attachment2.id.toString()],
      })

    expect(response.statusCode).toBe(201)
    expect(productDetailsResponseSchema.parse(response.body)).toBeTruthy()
    expect(response.body).toMatchObject({
      product: {
        title: 'New Product',
        description: 'Product description',
        priceInCents: 1000,
        status: 'available',
        owner: {
          id: seller.id.toString(),
          name: seller.name,
          email: seller.email,
          phone: seller.phone,
          avatar: null,
        },
        category: {
          id: category.id.toString(),
          title: category.title,
          slug: category.slug.value,
        },
      },
    })
  })

  test('[POST] /products - should return 401 when no authentication cookie is provided', async () => {
    const response = await request(httpServer).post('/products')

    expect(response.statusCode).toBe(401)
  })

  test('[POST] /products - should return 401 when invalid authentication cookie is provided', async () => {
    const response = await request(httpServer)
      .post('/products')
      .set('Cookie', 'access_token=invalid-token')

    expect(response.statusCode).toBe(401)
  })

  test('[POST] /products - should return 404 if attachments were not found', async () => {
    const { cookieString } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const category = await categoryFactory.makePrismaCategory()

    const response = await request(httpServer)
      .post('/products')
      .set('Cookie', cookieString)
      .send({
        title: 'New Product',
        description: 'Product description',
        priceInCents: 1000,
        categoryId: category.id.toString(),
        attachmentsIds: [faker.string.uuid(), faker.string.uuid()],
      })

    expect(response.statusCode).toBe(404)
    expect(response.body).toMatchObject({
      error: 'Not Found',
      message: 'Some attachments were not found.',
    })
  })

  test('[POST] /products - should return 404 if category is not found', async () => {
    const { cookieString } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const attachment1 = await attachmentFactory.makePrismaAttachment()
    const attachment2 = await attachmentFactory.makePrismaAttachment()

    const response = await request(httpServer)
      .post('/products')
      .set('Cookie', cookieString)
      .send({
        title: 'New Product',
        description: 'Product description',
        priceInCents: 1000,
        categoryId: faker.string.uuid(),
        attachmentsIds: [attachment1.id.toString(), attachment2.id.toString()],
      })

    expect(response.statusCode).toBe(404)
    expect(response.body).toMatchObject({
      error: 'Not Found',
      message: 'Category not found.',
    })
  })

  test('[POST] /products - should return 404 if seller is not found', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const category = await categoryFactory.makePrismaCategory()

    // Create attachments
    const attachment1 = await attachmentFactory.makePrismaAttachment()
    const attachment2 = await attachmentFactory.makePrismaAttachment()

    // Delete seller using prisma service to simulate not found
    await prisma.seller.delete({ where: { id: seller.id.toString() } })

    const response = await request(httpServer)
      .post('/products')
      .set('Cookie', cookieString)
      .send({
        title: 'New Product',
        description: 'Product description',
        priceInCents: 1000,
        categoryId: category.id.toString(),
        attachmentsIds: [attachment1.id.toString(), attachment2.id.toString()],
      })

    expect(response.statusCode).toBe(404)
    expect(response.body).toMatchObject({
      error: 'Not Found',
      message: 'Seller not found.',
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
