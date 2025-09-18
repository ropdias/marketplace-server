import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { AttachmentsRepository } from '../repositories/attachments-repository'
import { ProductsRepository } from '../repositories/products-repository'
import { SellersRepository } from '../repositories/sellers-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { CategoriesRepository } from '../repositories/categories-repository'
import { ProductAttachment } from '../../enterprise/entities/product-attachment'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ProductAttachmentList } from '../../enterprise/entities/product-attachment-list'
import {
  ProductStatus,
  ProductStatusEnum,
} from '../../enterprise/entities/value-objects/product-status'
import { NotProductOwnerError } from './errors/not-product-owner-error'
import { ProductAttachmentsRepository } from '../repositories/product-attachments-repository'
import { PriceInCents } from '../../enterprise/entities/value-objects/price-in-cents'
import { ProductDetailsDTO } from '../dtos/product-details-dtos'
import { ProductDetailsMapper } from '../mappers/product-details-mapper'
import { ProductHasAlreadyBeenSoldError } from './errors/product-has-already-been-sold-error'

interface EditProductUseCaseRequest {
  productId: string
  title: string
  categoryId: string
  description: string
  priceInCents: number
  attachmentsIds: string[]
  sellerId: string
}

type EditProductUseCaseResponse = Either<
  ResourceNotFoundError | NotProductOwnerError | ProductHasAlreadyBeenSoldError,
  {
    productDetails: ProductDetailsDTO
  }
>

@Injectable()
export class EditProductUseCase {
  constructor(
    private productsRepository: ProductsRepository,
    private sellersRepository: SellersRepository,
    private categoriesRepository: CategoriesRepository,
    private attachmentsRepository: AttachmentsRepository,
    private productAttachmentsRepository: ProductAttachmentsRepository,
  ) {}

  async execute({
    productId,
    title,
    categoryId,
    description,
    priceInCents,
    attachmentsIds,
    sellerId,
  }: EditProductUseCaseRequest): Promise<EditProductUseCaseResponse> {
    const seller = await this.sellersRepository.findById(sellerId)

    if (!seller) return left(new ResourceNotFoundError('Seller not found.'))

    const category = await this.categoriesRepository.findById(categoryId)

    if (!category) return left(new ResourceNotFoundError('Category not found.'))

    const attachments =
      await this.attachmentsRepository.findManyByIds(attachmentsIds)

    if (attachments.length !== attachmentsIds.length) {
      return left(new ResourceNotFoundError('Some attachments were not found.'))
    }

    const product = await this.productsRepository.findById(productId)

    if (!product) return left(new ResourceNotFoundError('Product not found.'))

    if (product.ownerId.toString() !== sellerId) {
      return left(new NotProductOwnerError())
    }

    if (product.status.equals(ProductStatus.create(ProductStatusEnum.SOLD))) {
      return left(new ProductHasAlreadyBeenSoldError())
    }

    const currentProductAttachments =
      await this.productAttachmentsRepository.findManyByProductId(productId)

    const productAttachmentList = new ProductAttachmentList(
      currentProductAttachments,
    )

    const productAttachments = attachmentsIds.map((attachmentId) => {
      return ProductAttachment.create({
        attachmentId: UniqueEntityID.create({ value: attachmentId }),
        productId: product.id,
      })
    })

    productAttachmentList.update(productAttachments)

    product.attachments = productAttachmentList
    product.title = title
    product.categoryId = category.id
    product.description = description
    product.priceInCents = PriceInCents.create(priceInCents)

    await this.productsRepository.save(product)

    const productDetails = await this.productsRepository.findProductDetailsById(
      product.id.toString(),
    )

    if (!productDetails) {
      return left(new ResourceNotFoundError('Product not found.'))
    }

    const productDetailsDTO = ProductDetailsMapper.toDTO(productDetails)

    return right({
      productDetails: productDetailsDTO,
    })
  }
}
