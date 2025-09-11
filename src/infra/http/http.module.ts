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

@Module({
  imports: [DatabaseModule, CryptographyModule, StorageModule],
  controllers: [
    AuthenticateSellerController,
    CreateSellerController,
    GetSellerProfileController,
  ],
  providers: [
    AuthenticateSellerUseCase,
    CreateSellerUseCase,
    GetSellerProfileUseCase,
    SellerProfileAssembler,
  ],
})
export class HttpModule {}
