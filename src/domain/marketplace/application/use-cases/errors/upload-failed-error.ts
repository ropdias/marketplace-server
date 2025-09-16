import { UseCaseError } from '@/core/errors/use-case-error'

export class UploadFailedError extends Error implements UseCaseError {
  constructor(cause: string) {
    super(`Upload failed: ${cause}.`)
  }
}
