import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { DatabaseModule } from '@/infra/database/database.module'
import { SellerFactory } from 'test/factories/make-seller'
import type { Server } from 'http'
import { createSellerAndLoginWithCookie } from 'test/utils/create-seller-and-login'
import { JwtService } from '@nestjs/jwt'
import cookieParser from 'cookie-parser'
import { CategoryFactory } from 'test/factories/make-category'
import { categoriesListResponseSchema } from '../presenters/category-presenter'

describe('Fetch all categories (E2E)', () => {
  let app: INestApplication
  let httpServer: Server
  let sellerFactory: SellerFactory
  let categoryFactory: CategoryFactory
  let jwtService: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [SellerFactory, CategoryFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    app.use(cookieParser())

    httpServer = app.getHttpServer() as Server
    jwtService = moduleRef.get(JwtService)

    sellerFactory = moduleRef.get(SellerFactory)
    categoryFactory = moduleRef.get(CategoryFactory)

    await app.init()
  })

  test('[GET] /categories - should return all categories', async () => {
    const { cookieString } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const category1 = await categoryFactory.makePrismaCategory({
      title: 'Electronics',
    })
    const category2 = await categoryFactory.makePrismaCategory({
      title: 'Books',
    })
    const category3 = await categoryFactory.makePrismaCategory({
      title: 'Clothing',
    })

    const response = await request(httpServer)
      .get('/categories')
      .set('Cookie', cookieString)

    expect(response.statusCode).toBe(200)
    expect(categoriesListResponseSchema.parse(response.body)).toBeTruthy()
    expect(response.body).toMatchObject({
      categories: [
        {
          id: category1.id.toString(),
          title: category1.title,
          slug: category1.slug.value,
        },
        {
          id: category2.id.toString(),
          title: category2.title,
          slug: category2.slug.value,
        },
        {
          id: category3.id.toString(),
          title: category3.title,
          slug: category3.slug.value,
        },
      ],
    })
  })

  test('[GET] /categories - should return 401 when no authentication cookie is provided', async () => {
    const response = await request(httpServer).get('/categories')

    expect(response.statusCode).toBe(401)
  })

  test('[GET] /categories - should return 401 when invalid authentication cookie is provided', async () => {
    const response = await request(httpServer)
      .get('/categories')
      .set('Cookie', 'access_token=invalid-token')

    expect(response.statusCode).toBe(401)
  })

  afterAll(async () => {
    await app.close()
  })
})
