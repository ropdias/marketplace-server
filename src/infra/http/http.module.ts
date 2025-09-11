import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { StorageModule } from '../storage/storage.module'
import { AuthenticateSellerController } from './controllers/authenticate-seller.controller'
import { AuthenticateSellerUseCase } from '@/domain/marketplace/application/use-cases/authenticate-seller'
import { CreateSellerController } from './controllers/create-seller.controller'
import { CreateSellerUseCase } from '@/domain/marketplace/application/use-cases/create-seller'
import { SellerProfileAssembler } from '@/domain/marketplace/application/assemblers/seller-profile-assembler'

@Module({
  imports: [DatabaseModule, CryptographyModule, StorageModule],
  controllers: [AuthenticateSellerController, CreateSellerController],
  providers: [
    AuthenticateSellerUseCase,
    CreateSellerUseCase,
    SellerProfileAssembler,
  ],
})
export class HttpModule {}
