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
import { productDetailsListResponseSchema } from '../presenters/product-details-presenter'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import {
  ProductStatus,
  ProductStatusEnum,
} from '@/domain/marketplace/enterprise/entities/value-objects/product-status'

describe('List all products from the seller (E2E)', () => {
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

  test('[GET] /products/me - should be able to get all products from the seller', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const anotherSeller = await sellerFactory.makePrismaSeller()

    const category = await categoryFactory.makePrismaCategory()

    const product1 = await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })

    const product2 = await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })

    // Products from another seller should not be listed
    const anotherProduct = await productFactory.makePrismaProduct({
      ownerId: anotherSeller.id,
      categoryId: category.id,
    })

    const response = await request(httpServer)
      .get('/products/me')
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(200)
    expect(productDetailsListResponseSchema.parse(response.body)).toBeTruthy()
    const parsedBody = productDetailsListResponseSchema.parse(response.body)
    const returnedIds = parsedBody.products.map((p) => p.id)
    expect(returnedIds).not.toContain(anotherProduct.id.toString())
    expect(returnedIds).toHaveLength(2)
    expect(parsedBody).toMatchObject({
      products: [
        {
          id: product1.id.toString(),
        },
        {
          id: product2.id.toString(),
        },
      ],
    })
  })

  test('[GET] /products/me - should be able to get all products from the seller with status sold', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const anotherSeller = await sellerFactory.makePrismaSeller()

    const category = await categoryFactory.makePrismaCategory()

    await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })

    const product2 = await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
      status: ProductStatus.create(ProductStatusEnum.SOLD),
    })

    // Products from another seller should not be listed
    const anotherProduct = await productFactory.makePrismaProduct({
      ownerId: anotherSeller.id,
      categoryId: category.id,
      status: ProductStatus.create(ProductStatusEnum.SOLD),
    })

    const response = await request(httpServer)
      .get('/products/me')
      .query({ status: 'sold' })
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(200)
    expect(productDetailsListResponseSchema.parse(response.body)).toBeTruthy()
    const parsedBody = productDetailsListResponseSchema.parse(response.body)
    const returnedIds = parsedBody.products.map((p) => p.id)
    expect(returnedIds).not.toContain(anotherProduct.id.toString())
    expect(returnedIds).toHaveLength(1)
    expect(parsedBody).toMatchObject({
      products: [
        {
          id: product2.id.toString(),
        },
      ],
    })
  })

  test('[GET] /products/me - should be able to get all products from the seller with title phone', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const anotherSeller = await sellerFactory.makePrismaSeller()

    const category = await categoryFactory.makePrismaCategory()

    await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
      title: 'Book about NestJS',
    })

    await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
      title: 'iPad Pro',
    })

    const product3 = await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
      title: 'iPhone 14',
    })

    // Products from another seller should not be listed
    const anotherProduct = await productFactory.makePrismaProduct({
      ownerId: anotherSeller.id,
      categoryId: category.id,
      title: 'iPhone 13',
    })

    const response = await request(httpServer)
      .get('/products/me')
      .query({ search: 'phone' })
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(200)
    expect(productDetailsListResponseSchema.parse(response.body)).toBeTruthy()
    const parsedBody = productDetailsListResponseSchema.parse(response.body)
    const returnedIds = parsedBody.products.map((p) => p.id)
    expect(returnedIds).not.toContain(anotherProduct.id.toString())
    expect(returnedIds).toHaveLength(1)
    expect(parsedBody).toMatchObject({
      products: [
        {
          id: product3.id.toString(),
        },
      ],
    })
  })

  test('[GET] /products/me - should be able to get all products from the seller with title phone and status sold', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const anotherSeller = await sellerFactory.makePrismaSeller()

    const category = await categoryFactory.makePrismaCategory()

    await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
      title: 'Book about NestJS',
    })

    await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
      title: 'iPhone 13',
    })

    const product3 = await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
      title: 'iPhone 14',
      status: ProductStatus.create(ProductStatusEnum.SOLD),
    })

    // Products from another seller should not be listed
    const anotherProduct = await productFactory.makePrismaProduct({
      ownerId: anotherSeller.id,
      categoryId: category.id,
      title: 'iPhone 13',
      status: ProductStatus.create(ProductStatusEnum.SOLD),
    })

    const response = await request(httpServer)
      .get('/products/me')
      .query({ search: 'phone' })
      .query({ status: 'sold' })
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(200)
    expect(productDetailsListResponseSchema.parse(response.body)).toBeTruthy()
    const parsedBody = productDetailsListResponseSchema.parse(response.body)
    const returnedIds = parsedBody.products.map((p) => p.id)
    expect(returnedIds).not.toContain(anotherProduct.id.toString())
    expect(returnedIds).toHaveLength(1)
    expect(parsedBody).toMatchObject({
      products: [
        {
          id: product3.id.toString(),
        },
      ],
    })
  })

  test('[GET] /products/me - should return 401 when no authentication cookie is provided', async () => {
    const response = await request(httpServer).get('/products/me')

    expect(response.statusCode).toBe(401)
  })

  test('[GET] /products/me - should return 401 when invalid authentication cookie is provided', async () => {
    const response = await request(httpServer)
      .get('/products/me')
      .set('Cookie', 'access_token=invalid-token')

    expect(response.statusCode).toBe(401)
  })

  test('[GET] /products/me - should return 400 when the provided product status is invalid', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const category = await categoryFactory.makePrismaCategory()

    await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })

    const response = await request(httpServer)
      .get('/products/me')
      .query({ status: 'not-valid-status' })
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(400)
  })

  test('[GET] /products/me - should return 404 if seller is not found', async () => {
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
      .get('/products/me')
      .set('Cookie', cookieString)

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
