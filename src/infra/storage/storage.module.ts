import { Module } from '@nestjs/common'
import { Uploader } from '@/domain/marketplace/application/storage/uploader'
import { S3Uploader } from './aws-s3-storage'

@Module({
  providers: [
    {
      provide: Uploader,
      useClass: S3Uploader,
    },
  ],
  exports: [Uploader],
})
export class StorageModule {}
