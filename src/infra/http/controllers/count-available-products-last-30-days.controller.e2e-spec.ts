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
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import {
  ProductStatus,
  ProductStatusEnum,
} from '@/domain/marketplace/enterprise/entities/value-objects/product-status'
import { Product } from '@/domain/marketplace/enterprise/entities/product'
import { dayjs } from '@/core/libs/dayjs'
import { Seller } from '@/domain/marketplace/enterprise/entities/seller'

describe('Count the amount of available products in 30 days (E2E)', () => {
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
    productFactory = moduleRef.get(ProductFactory)
    prisma = moduleRef.get(PrismaService)

    await app.init()
  })

  test('[GET] /sellers/metrics/products/available - should be able to count available products in the last 30 days', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const sellers: Seller[] = []
    for (let i = 0; i < 10; i++) {
      const otherSeller = await sellerFactory.makePrismaSeller()
      sellers.push(otherSeller)
    }

    const category = await categoryFactory.makePrismaCategory()

    const expectedProducts: Product[] = []
    const otherProducts: Product[] = []

    const now = dayjs().utc().startOf('day').toDate()

    // Create expectedProducts
    for (let i = 0; i < 30; i++) {
      const createdAt = dayjs.utc(now).subtract(i, 'day').toDate()
      const product = await productFactory.makePrismaProduct({
        ownerId: seller.id,
        categoryId: category.id,
        createdAt,
      })
      expectedProducts.push(product)
    }

    // Create otherProducts
    for (let i = 31; i < 61; i++) {
      const createdAt = dayjs.utc(now).subtract(i, 'day').toDate()
      const product = await productFactory.makePrismaProduct({
        ownerId: sellers[0].id,
        categoryId: category.id,
        createdAt,
      })
      otherProducts.push(product)
    }
    for (let i = 0; i < 30; i++) {
      const createdAt = dayjs.utc(now).subtract(i, 'day').toDate()
      const seller = sellers[1 + (i % (sellers.length - 1))]
      const product = await productFactory.makePrismaProduct({
        ownerId: seller.id,
        categoryId: category.id,
        createdAt,
      })
      otherProducts.push(product)
    }
    for (let i = 0; i < 30; i++) {
      const createdAt = dayjs.utc(now).subtract(i, 'day').toDate()
      const product = await productFactory.makePrismaProduct({
        ownerId: sellers[0].id,
        categoryId: category.id,
        createdAt,
        status: ProductStatus.create(ProductStatusEnum.SOLD),
      })
      otherProducts.push(product)
    }
    for (let i = 0; i < 30; i++) {
      const createdAt = dayjs.utc(now).subtract(i, 'day').toDate()
      const product = await productFactory.makePrismaProduct({
        ownerId: sellers[0].id,
        categoryId: category.id,
        createdAt,
        status: ProductStatus.create(ProductStatusEnum.CANCELLED),
      })
      otherProducts.push(product)
    }

    const response = await request(httpServer)
      .get('/sellers/metrics/products/available')
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(200)
    expect(response.body).toMatchObject({
      amount: expectedProducts.length,
    })
  })

  test('[GET] /sellers/metrics/products/available - should return 401 when no authentication cookie is provided', async () => {
    const response = await request(httpServer).get(
      '/sellers/metrics/products/available',
    )

    expect(response.statusCode).toBe(401)
  })

  test('[GET] /sellers/metrics/products/available - should return 401 when invalid authentication cookie is provided', async () => {
    const response = await request(httpServer)
      .get('/sellers/metrics/products/available')
      .set('Cookie', 'access_token=invalid-token')

    expect(response.statusCode).toBe(401)
  })

  test('[GET] /sellers/metrics/products/available - should return 404 if seller is not found', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    // Delete the seller to simulate not found
    await prisma.seller.delete({ where: { id: seller.id.toString() } })

    const response = await request(httpServer)
      .get('/sellers/metrics/products/available')
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
