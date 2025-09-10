import { ProductAttachment } from '../../enterprise/entities/product-attachment'

export abstract class ProductAttachmentsRepository {
  abstract updateMany(attachments: ProductAttachment[]): Promise<void>
  abstract deleteMany(attachments: ProductAttachment[]): Promise<void>

  abstract findManyByProductId(productId: string): Promise<ProductAttachment[]>
  abstract deleteManyByProductId(productId: string): Promise<void>
}
