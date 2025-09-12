import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { StorageModule } from '../storage/storage.module'
import { AuthenticateSellerController } from './controllers/authenticate-seller.controller'
import { AuthenticateSellerUseCase } from '@/domain/marketplace/application/use-cases/authenticate-seller'
import { CreateSellerController } from './controllers/create-seller.controller'
import { CreateSellerUseCase } from '@/domain/marketplace/application/use-cases/create-seller'
import { SellerProfileAssembler } from '@/domain/marketplace/application/assemblers/seller-profile-assembler'
import { GetSellerProfileController } from './controllers/get-seller-profile.controller'
import { GetSellerProfileUseCase } from '@/domain/marketplace/application/use-cases/get-seller-profile'
import { CountAvailableProductsLast30DaysController } from './controllers/count-available-products-last-30-days.controller'
import { CountAvailableProductsLast30DaysUseCase } from '@/domain/marketplace/application/use-cases/count-available-products-last-30-days'
import { CountProductViewsFromProductLast7DaysController } from './controllers/count-product-views-from-product-last-7-days.controller'
import { CountProductViewsFromProductLast7DaysUseCase } from '@/domain/marketplace/application/use-cases/count-product-views-from-product-last-7-days'
import { CountProductViewsLast30DaysController } from './controllers/count-product-views-last-30-days.controller'
import { CountProductViewsLast30DaysUseCase } from '@/domain/marketplace/application/use-cases/count-product-views-last-30-days'

@Module({
  imports: [DatabaseModule, CryptographyModule, StorageModule],
  controllers: [
    AuthenticateSellerController,
    CreateSellerController,
    GetSellerProfileController,
    CountAvailableProductsLast30DaysController,
    CountProductViewsLast30DaysController,
    CountProductViewsFromProductLast7DaysController,
  ],
  providers: [
    AuthenticateSellerUseCase,
    CreateSellerUseCase,
    GetSellerProfileUseCase,
    CountAvailableProductsLast30DaysUseCase,
    CountProductViewsLast30DaysUseCase,
    CountProductViewsFromProductLast7DaysUseCase,
    SellerProfileAssembler,
  ],
})
export class HttpModule {}
