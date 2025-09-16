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
import {
  ProductStatus,
  ProductStatusEnum,
} from '@/domain/marketplace/enterprise/entities/value-objects/product-status'

describe('Edit a product (E2E)', () => {
  let app: INestApplication
  let httpServer: Server
  let sellerFactory: SellerFactory
  let jwtService: JwtService
  let categoryFactory: CategoryFactory
  let attachmentFactory: AttachmentFactory
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
    attachmentFactory = moduleRef.get(AttachmentFactory)
    productFactory = moduleRef.get(ProductFactory)
    prisma = moduleRef.get(PrismaService)

    await app.init()
  })

  test('[PUT] /products/{id} - should be able to edit a product', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const category = await categoryFactory.makePrismaCategory()

    const product = await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })

    const newCategory = await categoryFactory.makePrismaCategory()
    const newAttachment1 = await attachmentFactory.makePrismaAttachment()
    const newAttachment2 = await attachmentFactory.makePrismaAttachment()

    const response = await request(httpServer)
      .put(`/products/${product.id.toString()}`)
      .set('Cookie', cookieString)
      .send({
        title: 'New Product title',
        description: 'New Product description',
        priceInCents: 2000,
        categoryId: newCategory.id.toString(),
        attachmentsIds: [
          newAttachment1.id.toString(),
          newAttachment2.id.toString(),
        ],
      })

    expect(response.statusCode).toBe(200)
    expect(productDetailsResponseSchema.parse(response.body)).toBeTruthy()
    expect(response.body).toMatchObject({
      product: {
        title: 'New Product title',
        description: 'New Product description',
        priceInCents: 2000,
        status: 'available',
        owner: {
          id: seller.id.toString(),
          name: seller.name,
          email: seller.email,
          phone: seller.phone,
          avatar: null,
        },
        category: {
          id: newCategory.id.toString(),
          title: newCategory.title,
          slug: newCategory.slug.value,
        },
      },
    })
  })

  test('[PUT] /products/{id} - should return 401 when no authentication cookie is provided', async () => {
    const response = await request(httpServer).put('/products/12345')

    expect(response.statusCode).toBe(401)
  })

  test('[PUT] /products/{id} - should return 401 when invalid authentication cookie is provided', async () => {
    const response = await request(httpServer)
      .put('/products/12345')
      .set('Cookie', 'access_token=invalid-token')

    expect(response.statusCode).toBe(401)
  })

  test('[PUT] /products/{id} - should return 403 if you are not the owner of the product', async () => {
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
      .put(`/products/${product.id.toString()}`)
      .set('Cookie', cookieString)
      .send({
        title: product.title,
        description: product.description,
        priceInCents: product.priceInCents.value,
        categoryId: product.categoryId.toString(),
        attachmentsIds: [],
      })

    expect(response.statusCode).toBe(403)
    expect(response.body).toMatchObject({
      error: 'Forbidden',
      message: 'User is not the owner of the product.',
    })
  })

  test('[PUT] /products/{id} - should return 403 if the product is already sold', async () => {
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
      .put(`/products/${product.id.toString()}`)
      .set('Cookie', cookieString)
      .send({
        title: product.title,
        description: product.description,
        priceInCents: product.priceInCents.value,
        categoryId: product.categoryId.toString(),
        attachmentsIds: [],
      })

    expect(response.statusCode).toBe(403)
    expect(response.body).toMatchObject({
      error: 'Forbidden',
      message: 'Product has already been sold.',
    })
  })

  test('[PUT] /products/{id} - should return 404 if attachments were not found', async () => {
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
      .put(`/products/${product.id.toString()}`)
      .set('Cookie', cookieString)
      .send({
        title: product.title,
        description: product.description,
        priceInCents: product.priceInCents.value,
        categoryId: product.categoryId.toString(),
        attachmentsIds: [faker.string.uuid(), faker.string.uuid()],
      })

    expect(response.statusCode).toBe(404)
    expect(response.body).toMatchObject({
      error: 'Not Found',
      message: 'Some attachments were not found.',
    })
  })

  test('[PUT] /products/{id} - should return 404 if category is not found', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const category = await categoryFactory.makePrismaCategory()

    const product = await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })

    const attachment1 = await attachmentFactory.makePrismaAttachment()
    const attachment2 = await attachmentFactory.makePrismaAttachment()

    const response = await request(httpServer)
      .put(`/products/${product.id.toString()}`)
      .set('Cookie', cookieString)
      .send({
        title: product.title,
        description: product.description,
        priceInCents: product.priceInCents.value,
        categoryId: faker.string.uuid(),
        attachmentsIds: [attachment1.id.toString(), attachment2.id.toString()],
      })

    expect(response.statusCode).toBe(404)
    expect(response.body).toMatchObject({
      error: 'Not Found',
      message: 'Category not found.',
    })
  })

  test('[PUT] /products/{id} - should return 404 if seller is not found', async () => {
    const { cookieString, seller } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const category = await categoryFactory.makePrismaCategory()

    const product = await productFactory.makePrismaProduct({
      ownerId: seller.id,
      categoryId: category.id,
    })

    const attachment1 = await attachmentFactory.makePrismaAttachment()
    const attachment2 = await attachmentFactory.makePrismaAttachment()

    // Delete product first, then seller to avoid foreign key constraint
    await prisma.product.delete({ where: { id: product.id.toString() } })
    await prisma.seller.delete({ where: { id: seller.id.toString() } })

    const response = await request(httpServer)
      .put(`/products/${product.id.toString()}`)
      .set('Cookie', cookieString)
      .send({
        title: product.title,
        description: product.description,
        priceInCents: product.priceInCents.value,
        categoryId: category.id.toString(),
        attachmentsIds: [attachment1.id.toString(), attachment2.id.toString()],
      })

    expect(response.statusCode).toBe(404)
    expect(response.body).toMatchObject({
      error: 'Not Found',
      message: 'Seller not found.',
    })
  })

  test('[PUT] /products/{id} - should return 404 if product is not found', async () => {
    const { cookieString } = await createSellerAndLoginWithCookie(
      sellerFactory,
      jwtService,
    )

    const category = await categoryFactory.makePrismaCategory()

    const attachment1 = await attachmentFactory.makePrismaAttachment()
    const attachment2 = await attachmentFactory.makePrismaAttachment()

    const response = await request(httpServer)
      .put(`/products/${faker.string.uuid()}`)
      .set('Cookie', cookieString)
      .send({
        title: 'New title',
        description: 'New description',
        priceInCents: 2000,
        categoryId: category.id.toString(),
        attachmentsIds: [attachment1.id.toString(), attachment2.id.toString()],
      })

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
