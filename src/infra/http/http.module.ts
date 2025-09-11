import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { StorageModule } from '../storage/storage.module'
import { AuthenticateSellerController } from './controllers/authenticate-seller.controller'
import { AuthenticateSellerUseCase } from '@/domain/marketplace/application/use-cases/authenticate-seller'

@Module({
  imports: [DatabaseModule, CryptographyModule, StorageModule],
  controllers: [AuthenticateSellerController],
  providers: [AuthenticateSellerUseCase],
})
export class HttpModule {}
