import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { DatabaseModule } from '@/infra/database/database.module'
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
import {
  ProductStatus,
  ProductStatusEnum,
} from '@/domain/marketplace/enterprise/entities/value-objects/product-status'

describe('Change the product status (E2E)', () => {
  let app: INestApplication
  let httpServer: Server
  let sellerFactory: SellerFactory
  let jwtService: JwtService
  let categoryFactory: CategoryFactory
  let productFactory: ProductFactory
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [ProductFactory, SellerFactory, CategoryFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    app.use(cookieParser())

    httpServer = app.getHttpServer() as Server

    sellerFactory = moduleRef.get(SellerFactory)
    jwtService = moduleRef.get(JwtService)
    categoryFactory = moduleRef.get(CategoryFactory)
    productFactory = moduleRef.get(ProductFactory)
    prisma = moduleRef.get(PrismaService)

    await app.init()
  })

  test('[PATCH] /products/{id}/{status} - should be able to change the product status to sold', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const category = await categoryFactory.makePrismaCategory()

    const product = await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })

    const response = await request(httpServer)
      .patch(`/products/${product.id.toString()}/sold`)
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(200)
    expect(productDetailsResponseSchema.parse(response.body)).toBeTruthy()
    expect(response.body).toMatchObject({
      product: {
        status: 'sold',
      },
    })
  })

  test('[PATCH] /products/{id}/{status} - should be able to change the product status to cancelled', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const category = await categoryFactory.makePrismaCategory()

    const product = await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })

    const response = await request(httpServer)
      .patch(`/products/${product.id.toString()}/cancelled`)
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(200)
    expect(productDetailsResponseSchema.parse(response.body)).toBeTruthy()
    expect(response.body).toMatchObject({
      product: {
        status: 'cancelled',
      },
    })
  })

  test('[PATCH] /products/{id}/{status} - should return 401 when no authentication cookie is provided', async () => {
    const response = await request(httpServer).patch('/products/12345/sold')

    expect(response.statusCode).toBe(401)
  })

  test('[PATCH] /products/{id}/{status} - should return 401 when invalid authentication cookie is provided', async () => {
    const response = await request(httpServer)
      .patch('/products/12345/sold')
      .set('Cookie', 'access_token=invalid-token')

    expect(response.statusCode).toBe(401)
  })

  test('[PATCH] /products/{id}/{status} - should return 400 when the provided product status is invalid', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const category = await categoryFactory.makePrismaCategory()

    const product = await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })

    const response = await request(httpServer)
      .patch(`/products/${product.id.toString()}/invalid-status`)
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(400)
    expect(response.body).toMatchObject({
      error: 'Bad Request',
      message: 'The provided product status is invalid.',
    })
  })

  test('[PATCH] /products/{id}/{status} - should return 403 if you are not the owner of the product', async () => {
    const wrongSeller = await sellerFactory.makePrismaSeller()

    const { cookieString } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const category = await categoryFactory.makePrismaCategory()

    const product = await productFactory.makePrismaProduct({
      ownerId: wrongSeller.id,
      categoryId: category.id,
    })

    const response = await request(httpServer)
      .patch(`/products/${product.id.toString()}/sold`)
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(403)
    expect(response.body).toMatchObject({
      error: 'Forbidden',
      message: 'User is not the owner of the product.',
    })
  })

  test('[PATCH] /products/{id}/{status} - should return 403 the product is with the same status', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const category = await categoryFactory.makePrismaCategory()

    const product = await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })

    const response = await request(httpServer)
      .patch(`/products/${product.id.toString()}/available`)
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(403)
    expect(response.body).toMatchObject({
      error: 'Forbidden',
      message: 'Product status is already the same.',
    })
  })

  test('[PATCH] /products/{id}/{status} - should return 404 if seller is not found', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const category = await categoryFactory.makePrismaCategory()

    const product = await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })

    // Delete product first, then seller to avoid foreign key constraint
    await prisma.product.delete({ where: { id: product.id.toString() } })
    await prisma.seller.delete({ where: { id: seller.id.toString() } })

    const response = await request(httpServer)
      .patch(`/products/${product.id.toString()}/sold`)
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(404)
    expect(response.body).toMatchObject({
      error: 'Not Found',
      message: 'Seller not found.',
    })
  })

  test('[PATCH] /products/{id}/{status} - should return 404 if product is not found', async () => {
    const { cookieString } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const response = await request(httpServer)
      .patch(`/products/${faker.string.uuid()}/sold`)
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(404)
    expect(response.body).toMatchObject({
      error: 'Not Found',
      message: 'Product not found.',
    })
  })

  test('[PATCH] /products/{id}/{status} - should return 409 if new status is cancelled and product is already sold', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const category = await categoryFactory.makePrismaCategory()

    const product = await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
      status: ProductStatus.create(ProductStatusEnum.SOLD),
    })

    const response = await request(httpServer)
      .patch(`/products/${product.id.toString()}/cancelled`)
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(409)
    expect(response.body).toMatchObject({
      error: 'Conflict',
      message: 'Product has already been sold.',
    })
  })

  test('[PATCH] /products/{id}/{status} - should return 409 if new status is sold and product is already cancelled', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const category = await categoryFactory.makePrismaCategory()

    const product = await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
      status: ProductStatus.create(ProductStatusEnum.CANCELLED),
    })

    const response = await request(httpServer)
      .patch(`/products/${product.id.toString()}/sold`)
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(409)
    expect(response.body).toMatchObject({
      error: 'Conflict',
      message: 'Product has already been cancelled.',
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
