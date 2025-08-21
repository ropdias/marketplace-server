import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { AttachmentsRepository } from '../repositories/attachments-repository'
import { Product } from '../../enterprise/entities/product'
import { ProductsRepository } from '../repositories/products-repository'
import { SellersRepository } from '../repositories/sellers-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { CategoriesRepository } from '../repositories/categories-repository'
import { ProductAttachment } from '../../enterprise/entities/product-attachment'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ProductAttachmentList } from '../../enterprise/entities/product-attachment-list'
import { PriceInCents } from '../../enterprise/entities/value-objects/price-in-cents'

interface CreateProductUseCaseRequest {
  title: string
  categoryId: string
  description: string
  priceInCents: number
  attachmentsIds: string[]
  sellerId: string
}

type CreateProductUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    product: Product
  }
>

@Injectable()
export class CreateProductUseCase {
  constructor(
    private productsRepository: ProductsRepository,
    private sellersRepository: SellersRepository,
    private categoriesRepository: CategoriesRepository,
    private attachmentsRepository: AttachmentsRepository,
  ) {}

  async execute({
    title,
    categoryId,
    description,
    priceInCents,
    attachmentsIds,
    sellerId,
  }: CreateProductUseCaseRequest): Promise<CreateProductUseCaseResponse> {
    const seller = await this.sellersRepository.findById(sellerId)

    if (!seller) {
      return left(new ResourceNotFoundError())
    }

    const category = await this.categoriesRepository.findById(categoryId)

    if (!category) {
      return left(new ResourceNotFoundError())
    }

    const attachments =
      await this.attachmentsRepository.findManyByIds(attachmentsIds)

    if (attachments.length !== attachmentsIds.length) {
      return left(new ResourceNotFoundError())
    }

    const product = Product.create({
      title,
      categoryId: UniqueEntityID.create({ value: categoryId }),
      description,
      priceInCents: PriceInCents.create(priceInCents),
      ownerId: UniqueEntityID.create({ value: sellerId }),
    })

    const productAttachments = attachmentsIds.map((attachmentId) => {
      return ProductAttachment.create({
        attachmentId: UniqueEntityID.create({ value: attachmentId }),
        productId: product.id,
      })
    })

    product.attachments = new ProductAttachmentList(productAttachments)

    await this.productsRepository.create(product)

    return right({
      product,
    })
  }
}
