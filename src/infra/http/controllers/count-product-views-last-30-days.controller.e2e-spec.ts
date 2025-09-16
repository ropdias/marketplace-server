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

describe('Count the number of views received by the seller in 30 days', () => {
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

  test('[GET] /sellers/metrics/views - should be able to count views in the last 30 days', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const sellers: Seller[] = []
    for (let i = 0; i < 3; i++) {
      const otherSeller = await sellerFactory.makePrismaSeller()
      sellers.push(otherSeller)
    }

    const category = await categoryFactory.makePrismaCategory()

    const productsFromSeller: Product[] = []
    const productsFromOtherSellers: Product[] = []

    const now = dayjs().utc().startOf('day').toDate()

    // 10 products to seller (target)
    for (let i = 0; i < 10; i++) {
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

    // Create valid views: sellers 1 and 2 viewing products from seller[0] in the last 30 days
    // Each seller views 3 distinct products
    for (let i = 1; i <= 2; i++) {
      const viewer = sellers[i]
      for (let j = 0; j < 3; j++) {
        const product = productsFromSeller[i * 3 + j - 1]
        const createdAt = dayjs
          .utc(now)
          .subtract(i * 3 + j, 'day')
          .toDate()

        await productViewFactory.makePrismaProductView({
          productId: product.id,
          viewerId: viewer.id,
          createdAt,
        })
      }
    }

    // Views that SHOULD NOT count:
    // - sellers[0] viewing products from other sellers within 30 days
    // - old views (>30 days)
    await productViewFactory.makePrismaProductView({
      productId: productsFromOtherSellers[0].id,
      viewerId: seller.id, // own seller
      createdAt: dayjs.utc(now).subtract(5, 'day').toDate(), // within 30 days
    })
    await productViewFactory.makePrismaProductView({
      productId: productsFromSeller[0].id,
      viewerId: sellers[1].id,
      createdAt: dayjs.utc(now).subtract(31, 'day').toDate(), // older than 30 days
    })

    const response = await request(httpServer)
      .get('/sellers/metrics/views')
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(200)
    expect(response.body).toMatchObject({
      // 2 sellers × 3 views each = 6 valid views
      amount: 6,
    })
  })

  test('[GET] /sellers/metrics/views - should return 401 when no authentication cookie is provided', async () => {
    const response = await request(httpServer).get('/sellers/metrics/views')

    expect(response.statusCode).toBe(401)
  })

  test('[GET] /sellers/metrics/views - should return 401 when invalid authentication cookie is provided', async () => {
    const response = await request(httpServer)
      .get('/sellers/metrics/views')
      .set('Cookie', 'access_token=invalid-token')

    expect(response.statusCode).toBe(401)
  })

  test('[GET] /sellers/metrics/views - should return 404 if seller is not found', async () => {
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
      .get('/sellers/metrics/views')
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
