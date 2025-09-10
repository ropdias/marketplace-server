/* eslint-disable @typescript-eslint/require-await */
import {
  Uploader,
  UploadParams,
} from '@/domain/marketplace/application/storage/uploader'
import { randomUUID } from 'crypto'

interface Upload {
  fileName: string
  url: string
}

export class FakeUploader implements Uploader {
  public uploads: Upload[] = []
  public shouldFail = false

  async upload({ fileName }: UploadParams): Promise<{ url: string }> {
    if (this.shouldFail) {
      throw new Error('Simulated upload failure')
    }

    const url = randomUUID()

    this.uploads.push({
      fileName,
      url,
    })

    return { url }
  }

  async deleteMany(urls: string[]): Promise<void> {
    if (this.shouldFail) {
      throw new Error('Simulated delete failure')
    }
    this.uploads = this.uploads.filter((upload) => !urls.includes(upload.url))
  }
}
