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
import { productViewResponseSchema } from '../presenters/product-view-presenter'
import { faker } from '@faker-js/faker'
import { ProductViewFactory } from 'test/factories/make-product-view'

describe('Register a view on a product (E2E)', () => {
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

  test('[POST] /products/{id}/views - should be able to register a view on a product', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const anotherSeller = await sellerFactory.makePrismaSeller()

    const category = await categoryFactory.makePrismaCategory()

    const productFromAnotherSeller = await productFactory.makePrismaProduct({
      ownerId: anotherSeller.id,
      categoryId: category.id,
    })

    const response = await request(httpServer)
      .post(`/products/${productFromAnotherSeller.id.toString()}/views`)
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(201)
    expect(productViewResponseSchema.parse(response.body)).toBeTruthy()
    const parsedBody = productViewResponseSchema.parse(response.body)
    expect(parsedBody).toMatchObject({
      product: {
        id: productFromAnotherSeller.id.toString(),
        owner: {
          id: anotherSeller.id.toString(),
        },
      },
      viewer: {
        id: seller.id.toString(),
      },
    })
  })

  test('[POST] /products/{id}/views - should return 401 when no authentication cookie is provided', async () => {
    const response = await request(httpServer).post('/products/12345/views')

    expect(response.statusCode).toBe(401)
  })

  test('[POST] /products/{id}/views - should return 401 when invalid authentication cookie is provided', async () => {
    const response = await request(httpServer)
      .post('/products/12345/views')
      .set('Cookie', 'access_token=invalid-token')

    expect(response.statusCode).toBe(401)
  })

  test('[POST] /products/{id}/views - should return 403 the viewer is the owner of the product', async () => {
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
      .post(`/products/${product.id.toString()}/views`)
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(403)
    expect(response.body).toMatchObject({
      error: 'Forbidden',
      message: 'The viewer is the owner of the product.',
    })
  })

  test('[POST] /products/{id}/views - should return 404 if seller is not found', async () => {
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
      .post(`/products/${product.id.toString()}/views`)
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(404)
    expect(response.body).toMatchObject({
      error: 'Not Found',
      message: 'Seller not found.',
    })
  })

  test('[POST] /products/{id}/views - should return 404 if product is not found', async () => {
    const { cookieString } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const response = await request(httpServer)
      .post(`/products/${faker.string.uuid()}/views`)
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(404)
    expect(response.body).toMatchObject({
      error: 'Not Found',
      message: 'Product not found.',
    })
  })

  test('[POST] /products/{id}/views - should return 409 if product view already exists', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const anotherSeller = await sellerFactory.makePrismaSeller()

    const category = await categoryFactory.makePrismaCategory()

    const productFromAnotherSeller = await productFactory.makePrismaProduct({
      ownerId: anotherSeller.id,
      categoryId: category.id,
    })

    await productViewFactory.makePrismaProductView({
      productId: productFromAnotherSeller.id,
      viewerId: seller.id,
    })

    const response = await request(httpServer)
      .post(`/products/${productFromAnotherSeller.id.toString()}/views`)
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(409)
    expect(response.body).toMatchObject({
      error: 'Conflict',
      message: 'The product view already exists.',
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
