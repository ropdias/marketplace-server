import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { AttachmentsRepository } from '@/domain/marketplace/application/repositories/attachments-repository'
import { PrismaAttachmentsRepository } from './prisma/repositories/prisma-attachments-repository'
import { CategoriesRepository } from '@/domain/marketplace/application/repositories/categories-repository'
import { PrismaCategoriesRepository } from './prisma/repositories/prisma-categories-repository'
import { ProductAttachmentsRepository } from '@/domain/marketplace/application/repositories/product-attachments-repository'
import { PrismaProductAttachmentsRepository } from './prisma/repositories/prisma-product-attachments-repository'
import { ProductViewsRepository } from '@/domain/marketplace/application/repositories/product-views-repository'
import { PrismaProductViewsRepository } from './prisma/repositories/prisma-product-views-repository'
import { ProductsRepository } from '@/domain/marketplace/application/repositories/products-repository'
import { PrismaProductsRepository } from './prisma/repositories/prisma-products-repository'
import { SellersRepository } from '@/domain/marketplace/application/repositories/sellers-repository'
import { PrismaSellersRepository } from './prisma/repositories/prisma-sellers-repository'

@Module({
  providers: [
    PrismaService,
    { provide: AttachmentsRepository, useClass: PrismaAttachmentsRepository },
    { provide: CategoriesRepository, useClass: PrismaCategoriesRepository },
    {
      provide: ProductAttachmentsRepository,
      useClass: PrismaProductAttachmentsRepository,
    },
    { provide: ProductViewsRepository, useClass: PrismaProductViewsRepository },
    { provide: ProductsRepository, useClass: PrismaProductsRepository },
    { provide: SellersRepository, useClass: PrismaSellersRepository },
  ],
  exports: [
    PrismaService,
    AttachmentsRepository,
    CategoriesRepository,
    ProductAttachmentsRepository,
    ProductViewsRepository,
    ProductsRepository,
    SellersRepository,
  ],
})
export class DatabaseModule {}
