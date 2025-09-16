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

describe('Get a product by its ID (E2E)', () => {
  let app: INestApplication
  let httpServer: Server
  let sellerFactory: SellerFactory
  let jwtService: JwtService
  let categoryFactory: CategoryFactory
  let productFactory: ProductFactory

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

    await app.init()
  })

  test('[GET] /products/{id} - should be able to get a product by its id', async () => {
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
      .get(`/products/${product.id.toString()}`)
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(200)
    expect(productDetailsResponseSchema.parse(response.body)).toBeTruthy()
    expect(response.body).toMatchObject({
      product: {
        title: product.title,
        description: product.description,
        priceInCents: product.priceInCents.value,
        status: product.status.value,
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

  test('[GET] /products/{id} - should return 401 when no authentication cookie is provided', async () => {
    const response = await request(httpServer).put('/products/12345')

    expect(response.statusCode).toBe(401)
  })

  test('[GET] /products/{id} - should return 401 when invalid authentication cookie is provided', async () => {
    const response = await request(httpServer)
      .put('/products/12345')
      .set('Cookie', 'access_token=invalid-token')

    expect(response.statusCode).toBe(401)
  })

  test('[GET] /products/{id} - should return 404 if product is not found', async () => {
    const { cookieString } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const response = await request(httpServer)
      .get(`/products/${faker.string.uuid()}`)
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
