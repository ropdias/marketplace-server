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
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { Product } from '@/domain/marketplace/enterprise/entities/product'
import { dayjs } from '@/core/libs/dayjs'
import { Seller } from '@/domain/marketplace/enterprise/entities/seller'
import { ProductViewFactory } from 'test/factories/make-product-view'
import { faker } from '@faker-js/faker'

describe('Count the number of views received by a product in the last 7 days (E2E)', () => {
  let app: INestApplication
  let httpServer: Server
  let sellerFactory: SellerFactory
  let jwtService: JwtService
  let categoryFactory: CategoryFactory
  let productFactory: ProductFactory
  let productViewFactory: ProductViewFactory
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        ProductFactory,
        SellerFactory,
        CategoryFactory,
        ProductViewFactory,
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    app.use(cookieParser())

    httpServer = app.getHttpServer() as Server

    sellerFactory = moduleRef.get(SellerFactory)
    jwtService = moduleRef.get(JwtService)
    categoryFactory = moduleRef.get(CategoryFactory)
    productFactory = moduleRef.get(ProductFactory)
    productViewFactory = moduleRef.get(ProductViewFactory)
    prisma = moduleRef.get(PrismaService)

    await app.init()
  })

  test('[GET] /products/{id}/metrics/views - should be able to count views for a product in the last 7 days', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const sellers: Seller[] = []
    for (let i = 0; i < 5; i++) {
      const otherSeller = await sellerFactory.makePrismaSeller()
      sellers.push(otherSeller)
    }

    const category = await categoryFactory.makePrismaCategory()

    const productsFromSeller: Product[] = []
    const productsFromOtherSellers: Product[] = []

    const now = dayjs().utc().startOf('day').toDate()

    // 5 products to seller (target)
    for (let i = 0; i < 5; i++) {
      const product = await productFactory.makePrismaProduct({
        ownerId: seller.id,
        categoryId: category.id,
      })
      productsFromSeller.push(product)
    }

    // 5 products for other sellers
    for (let i = 0; i < 5; i++) {
      const seller = sellers[1 + (i % 2)]
      const product = await productFactory.makePrismaProduct({
        ownerId: seller.id,
        categoryId: category.id,
      })
      productsFromOtherSellers.push(product)
    }

    // Create valid views: sellers viewing productsFromSeller[0] from seller in the last 7 days
    await productViewFactory.makePrismaProductView({
      productId: productsFromSeller[0].id,
      viewerId: sellers[1].id,
      createdAt: dayjs.utc(now).subtract(7, 'day').toDate(),
    })
    await productViewFactory.makePrismaProductView({
      productId: productsFromSeller[0].id,
      viewerId: sellers[2].id,
      createdAt: dayjs.utc(now).subtract(0, 'day').toDate(),
    })
    await productViewFactory.makePrismaProductView({
      productId: productsFromSeller[0].id,
      viewerId: sellers[3].id,
      createdAt: dayjs.utc(now).subtract(4, 'day').toDate(),
    })

    // Views that SHOULD NOT count:
    // - seller viewing products from other sellers within 7 days
    // - old views (>7 days)
    await productViewFactory.makePrismaProductView({
      productId: productsFromOtherSellers[0].id,
      viewerId: seller.id, // own seller
      createdAt: dayjs.utc(now).subtract(5, 'day').toDate(), // within 7 days
    })
    await productViewFactory.makePrismaProductView({
      productId: productsFromSeller[0].id,
      viewerId: sellers[4].id,
      createdAt: dayjs.utc(now).subtract(8, 'day').toDate(), // older than 7 days
    })

    const response = await request(httpServer)
      .get(`/products/${productsFromSeller[0].id.toString()}/metrics/views`)
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(200)
    expect(response.body).toMatchObject({
      amount: 3,
    })
  })

  test('[GET] /products/{id}/metrics/views - should return 401 when no authentication cookie is provided', async () => {
    const response = await request(httpServer).get(
      '/products/12345/metrics/views',
    )

    expect(response.statusCode).toBe(401)
  })

  test('[GET] /products/{id}/metrics/views - should return 401 when invalid authentication cookie is provided', async () => {
    const response = await request(httpServer)
      .get('/products/12345/metrics/views')
      .set('Cookie', 'access_token=invalid-token')

    expect(response.statusCode).toBe(401)
  })

  test('[GET] /products/{id}/metrics/views - should return 404 if seller is not found', async () => {
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
      .get(`/products/${product.id.toString()}/metrics/views`)
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(404)
    expect(response.body).toMatchObject({
      error: 'Not Found',
      message: 'Seller not found.',
    })
  })

  test('[GET] /products/{id}/metrics/views - should return 404 if product is not found', async () => {
    const { cookieString } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const response = await request(httpServer)
      .get(`/products/${faker.string.uuid()}/metrics/views`)
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(404)
    expect(response.body).toMatchObject({
      error: 'Not Found',
      message: 'Product not found.',
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
