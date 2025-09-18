import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  ProductStatus,
  ProductStatusEnum,
} from '@/domain/marketplace/enterprise/entities/value-objects/product-status'
import { Slug } from '@/domain/marketplace/enterprise/entities/value-objects/slug'
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaCategoryMapper } from '@/infra/database/prisma/mappers/prisma-category-mapper'
import { PrismaProductMapper } from '@/infra/database/prisma/mappers/prisma-product-mapper'
import { PrismaProductViewMapper } from '@/infra/database/prisma/mappers/prisma-product-view-mapper'
import { PrismaSellerMapper } from '@/infra/database/prisma/mappers/prisma-seller-mapper'
import { faker } from '@faker-js/faker'
import { hash } from 'bcryptjs'
import { makeCategory } from 'test/factories/make-category'
import { makeProduct } from 'test/factories/make-product'
import { makeProductView } from 'test/factories/make-product-view'
import { makeSeller } from 'test/factories/make-seller'

const prisma = new PrismaClient()

async function main() {
  await prisma.productView.deleteMany()
  await prisma.product.deleteMany()
  await prisma.seller.deleteMany()
  await prisma.category.deleteMany()
  await prisma.attachment.deleteMany()

  const categories = await prisma.category.createManyAndReturn({
    data: [
      { title: 'Eletrodomésticos' },
      { title: 'Eletrônicos' },
      { title: 'Informática' },
      { title: 'Móveis' },
      { title: 'Decoração' },
      { title: 'Moda' },
      { title: 'Esportes' },
      { title: 'Brinquedos' },
      { title: 'Livros' },
      { title: 'Alimentos' },
    ]
      .map((category) => {
        return makeCategory({
          title: category.title,
          slug: Slug.createFromText(category.title),
        })
      })
      .map((category) => PrismaCategoryMapper.toPrisma(category)),
  })

  const seller = await prisma.seller.create({
    data: PrismaSellerMapper.toPrisma(
      makeSeller({
        name: 'Seller',
        email: 'seller@mba.com',
        password: await hash('123456', 10),
      }),
    ),
  })

  const viewers = await prisma.seller.createManyAndReturn({
    data: Array.from({ length: faker.number.int({ min: 175, max: 200 }) }).map(
      () => PrismaSellerMapper.toPrisma(makeSeller()),
    ),
  })

  // create products
  const numberOfProducts = faker.number.int({ min: 10, max: 15 })
  await Promise.all(
    Array.from({ length: numberOfProducts }).map(async () => {
      return prisma.product.create({
        data: PrismaProductMapper.toPrisma(
          makeProduct({
            ownerId: UniqueEntityID.create({ value: seller.id }),
            status: ProductStatus.create(
              faker.helpers.arrayElement([
                ProductStatusEnum.AVAILABLE,
                ProductStatusEnum.CANCELLED,
                ProductStatusEnum.SOLD,
              ]),
            ),
            categoryId: UniqueEntityID.create({
              value: faker.helpers.arrayElement(categories).id,
            }),
          }),
        ),
      })
    }),
  )

  const products = await prisma.product.findMany()

  // create product views
  await Promise.all(
    viewers.map(async (viewer) => {
      return prisma.productView.create({
        data: PrismaProductViewMapper.toPrisma(
          makeProductView({
            productId: UniqueEntityID.create({
              value: faker.helpers.arrayElement(products).id,
            }),
            viewerId: UniqueEntityID.create({ value: viewer.id }),
            createdAt: faker.date.recent({ days: 50 }),
          }),
        ),
      })
    }),
  )
}

async function runSeed() {
  try {
    await main()
    console.log('Seed completed successfully!')
  } catch (e) {
    console.error(e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

void runSeed()
