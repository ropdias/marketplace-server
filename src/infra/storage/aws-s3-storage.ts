import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3'
import { Injectable } from '@nestjs/common'
import { EnvService } from '../env/env.service'
import { randomUUID } from 'node:crypto'
import {
  Uploader,
  UploadParams,
} from '@/domain/marketplace/application/storage/uploader'

@Injectable()
export class S3Uploader implements Uploader {
  private client: S3Client

  constructor(private envService: EnvService) {
    this.client = new S3Client({
      region: this.envService.get('AWS_REGION'),
      credentials: {
        accessKeyId: envService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: envService.get('AWS_SECRET_ACCESS_KEY'),
      },
    })
  }

  async upload({
    fileName,
    fileType,
    body,
  }: UploadParams): Promise<{ url: string }> {
    const uploadId = randomUUID()
    const uniqueFileName = `${uploadId}-${fileName}`

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.envService.get('AWS_BUCKET_NAME'),
        Key: uniqueFileName,
        ContentType: fileType,
        Body: body,
      }),
    )

    return {
      url: uniqueFileName,
    }
  }

  async deleteMany(urls: string[]): Promise<void> {
    if (urls.length === 0) return

    const objects = urls.map((url) => ({ Key: url }))

    await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.envService.get('AWS_BUCKET_NAME'),
        Delete: { Objects: objects },
      }),
    )
  }
}
