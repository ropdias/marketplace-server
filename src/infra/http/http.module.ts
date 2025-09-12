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
import { CountProductViewsPerDayLast30DaysController } from './controllers/count-product-views-per-day-last-30-days.controller'
import { CountProductViewsPerDayLast30DaysUseCase } from '@/domain/marketplace/application/use-cases/count-product-views-per-day-last-30-days'
import { CountSoldProductsLast30DaysController } from './controllers/count-sold-products-last-30-days.controller'
import { CountSoldProductsLast30DaysUseCase } from '@/domain/marketplace/application/use-cases/count-sold-products-last-30-days'
import { CreateProductController } from './controllers/create-product.controller'
import { CreateProductUseCase } from '@/domain/marketplace/application/use-cases/create-product'
import { ProductDetailsAssembler } from '@/domain/marketplace/application/assemblers/product-details-assembler'
import { GetProductDetailsController } from './controllers/get-product-details.controller'
import { GetProductDetailsUseCase } from '@/domain/marketplace/application/use-cases/get-product-details'
import { EditProductController } from './controllers/edit-product.controller'
import { EditProductUseCase } from '@/domain/marketplace/application/use-cases/edit-product'
import { EditSellerController } from './controllers/edit-seller.controller'
import { EditSellerUseCase } from '@/domain/marketplace/application/use-cases/edit-seller'
import { FetchAllProductsFromSellerController } from './controllers/fetch-all-products-from-seller.controller'
import { FetchAllProductsFromSellerUseCase } from '@/domain/marketplace/application/use-cases/fetch-all-products-from-seller'

@Module({
  imports: [DatabaseModule, CryptographyModule, StorageModule],
  controllers: [
    AuthenticateSellerController,
    CreateSellerController,
    EditSellerController,
    GetSellerProfileController,
    CountSoldProductsLast30DaysController,
    CountAvailableProductsLast30DaysController,
    CountProductViewsLast30DaysController,
    CountProductViewsPerDayLast30DaysController,
    CountProductViewsFromProductLast7DaysController,
    FetchAllProductsFromSellerController,
    CreateProductController,
    GetProductDetailsController,
    EditProductController,
  ],
  providers: [
    AuthenticateSellerUseCase,
    CreateSellerUseCase,
    EditSellerUseCase,
    GetSellerProfileUseCase,
    CountSoldProductsLast30DaysUseCase,
    CountAvailableProductsLast30DaysUseCase,
    CountProductViewsLast30DaysUseCase,
    CountProductViewsPerDayLast30DaysUseCase,
    CountProductViewsFromProductLast7DaysUseCase,
    FetchAllProductsFromSellerUseCase,
    CreateProductUseCase,
    GetProductDetailsUseCase,
    EditProductUseCase,
    SellerProfileAssembler,
    ProductDetailsAssembler,
  ],
})
export class HttpModule {}
