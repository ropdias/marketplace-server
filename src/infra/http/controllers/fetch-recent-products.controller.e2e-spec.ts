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
import { Product } from '@/domain/marketplace/enterprise/entities/product'

describe('List all products​ (E2E)', () => {
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

  beforeEach(async () => {
    await prisma.product.deleteMany()
    await prisma.seller.deleteMany()
    await prisma.category.deleteMany()
  })

  test('[GET] /products - should be able to get all recent products', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const anotherSeller = await sellerFactory.makePrismaSeller()

    const category = await categoryFactory.makePrismaCategory()

    const base = Date.now()
    const product1 = await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
      createdAt: new Date(base - 2000),
    })

    const product2 = await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
      createdAt: new Date(base - 1000),
    })

    const anotherProduct = await productFactory.makePrismaProduct({
      ownerId: anotherSeller.id,
      categoryId: category.id,
      createdAt: new Date(base),
    })

    const response = await request(httpServer)
      .get('/products')
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(200)
    expect(productDetailsListResponseSchema.parse(response.body)).toBeTruthy()
    const parsedBody = productDetailsListResponseSchema.parse(response.body)
    expect(parsedBody.products).toHaveLength(3)
    expect(parsedBody).toMatchObject({
      products: [
        {
          id: anotherProduct.id.toString(),
        },
        {
          id: product2.id.toString(),
        },
        {
          id: product1.id.toString(),
        },
      ],
    })
  })

  test('[GET] /products - should be able to get all recent products with status sold', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const anotherSeller = await sellerFactory.makePrismaSeller()

    const category = await categoryFactory.makePrismaCategory()

    const base = Date.now()
    await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
      createdAt: new Date(base - 2000),
    })

    const product2 = await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
      status: ProductStatus.create(ProductStatusEnum.SOLD),
      createdAt: new Date(base - 1000),
    })

    const anotherProduct = await productFactory.makePrismaProduct({
      ownerId: anotherSeller.id,
      categoryId: category.id,
      status: ProductStatus.create(ProductStatusEnum.SOLD),
      createdAt: new Date(base),
    })

    const response = await request(httpServer)
      .get('/products')
      .query({ status: 'sold' })
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(200)
    expect(productDetailsListResponseSchema.parse(response.body)).toBeTruthy()
    const parsedBody = productDetailsListResponseSchema.parse(response.body)
    expect(parsedBody.products).toHaveLength(2)
    expect(parsedBody).toMatchObject({
      products: [
        {
          id: anotherProduct.id.toString(),
        },
        {
          id: product2.id.toString(),
        },
      ],
    })
  })

  test('[GET] /products - should be able to get all recent products with title phone', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const anotherSeller = await sellerFactory.makePrismaSeller()

    const category = await categoryFactory.makePrismaCategory()

    const base = Date.now()
    await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
      title: 'Book about NestJS',
      createdAt: new Date(base - 2000),
    })

    const product2 = await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
      title: 'iPhone 14',
      createdAt: new Date(base - 1000),
    })

    const anotherProduct = await productFactory.makePrismaProduct({
      ownerId: anotherSeller.id,
      categoryId: category.id,
      title: 'iPhone 13',
      createdAt: new Date(base),
    })

    const response = await request(httpServer)
      .get('/products')
      .query({ search: 'phone' })
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(200)
    expect(productDetailsListResponseSchema.parse(response.body)).toBeTruthy()
    const parsedBody = productDetailsListResponseSchema.parse(response.body)
    expect(parsedBody.products).toHaveLength(2)
    expect(parsedBody).toMatchObject({
      products: [
        {
          id: anotherProduct.id.toString(),
        },
        {
          id: product2.id.toString(),
        },
      ],
    })
  })

  test('[GET] /products - should be able to get all recent products with title phone and status sold', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const anotherSeller = await sellerFactory.makePrismaSeller()

    const category = await categoryFactory.makePrismaCategory()

    const base = Date.now()
    await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
      title: 'Book about NestJS',
      createdAt: new Date(base - 2000),
    })

    const product2 = await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
      title: 'iPhone 14',
      status: ProductStatus.create(ProductStatusEnum.SOLD),
      createdAt: new Date(base - 1000),
    })

    await productFactory.makePrismaProduct({
      ownerId: anotherSeller.id,
      categoryId: category.id,
      title: 'iPhone 13',
      createdAt: new Date(base),
    })

    const response = await request(httpServer)
      .get('/products')
      .query({ status: 'sold' })
      .query({ search: 'phone' })
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(200)
    expect(productDetailsListResponseSchema.parse(response.body)).toBeTruthy()
    const parsedBody = productDetailsListResponseSchema.parse(response.body)
    expect(parsedBody.products).toHaveLength(1)
    expect(parsedBody).toMatchObject({
      products: [
        {
          id: product2.id.toString(),
        },
      ],
    })
  })

  test('[GET] /products - should be able to get all recent products from page 2', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const anotherSeller = await sellerFactory.makePrismaSeller()

    const category = await categoryFactory.makePrismaCategory()

    const base = Date.now()
    const allProducts: Product[] = []

    // creates 60 products in total
    for (let i = 0; i < 60; i++) {
      const isSeller = i % 2 === 0 // alternate between the two sellers
      const ownerId = isSeller ? seller.id : anotherSeller.id

      const product = await productFactory.makePrismaProduct({
        ownerId,
        categoryId: category.id,
        title: `Product ${i}`,
        createdAt: new Date(base - i * 1000),
      })

      allProducts.push(product)
    }

    // sort locally the same as the database: most recent first
    const sortedProducts = allProducts.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )

    // page 2 → gets from index 20 to 39
    const expectedPage2 = sortedProducts.slice(20, 40)

    const response = await request(httpServer)
      .get('/products')
      .query({ page: 2 })
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(200)
    expect(productDetailsListResponseSchema.parse(response.body)).toBeTruthy()
    const parsedBody = productDetailsListResponseSchema.parse(response.body)
    expect(parsedBody.products).toHaveLength(20)
    const returnedIds = parsedBody.products.map((p) => p.id)
    const expectedIds = expectedPage2.map((p) => p.id.toString())
    expect(returnedIds).toEqual(expectedIds)
  })

  test('[GET] /products - should return 401 when no authentication cookie is provided', async () => {
    const response = await request(httpServer).get('/products')

    expect(response.statusCode).toBe(401)
  })

  test('[GET] /products - should return 401 when invalid authentication cookie is provided', async () => {
    const response = await request(httpServer)
      .get('/products')
      .set('Cookie', 'access_token=invalid-token')

    expect(response.statusCode).toBe(401)
  })

  test('[GET] /products - should return 400 when the provided product status is invalid', async () => {
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
      .get('/products')
      .query({ status: 'not-valid-status' })
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(400)
  })

  afterAll(async () => {
    await app.close()
  })
})
