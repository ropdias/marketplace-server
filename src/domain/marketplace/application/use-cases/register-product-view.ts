import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { ProductViewsRepository } from '../repositories/product-views-repository'
import { ProductView } from '../../enterprise/entities/product-view'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ProductsRepository } from '../repositories/products-repository'
import { SellersRepository } from '../repositories/sellers-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { ViewerIsProductOwnerError } from './errors/viewer-is-product-owner-error'
import { ProductViewAlreadyExistsError } from './errors/product-view-already-exists-error'
import { ProductDetailsFactory } from '../factories/product-details-factory'
import { SellerProfileFactory } from '../factories/seller-profile-factory'
import { CategoriesRepository } from '../repositories/categories-repository'
import { AttachmentsRepository } from '../repositories/attachments-repository'
import { ProductDetailsDTO } from '../dtos/product-details-dtos'
import { SellerProfileDTO } from '../dtos/seller-profile-dtos'
import { SellerProfileMapper } from '../mappers/seller-profile-mapper'
import { ProductDetailsMapper } from '../mappers/product-details-mapper'

interface RegisterProductViewRequest {
  productId: string
  viewerId: string
}

type RegisterProductViewResponse = Either<
  | ResourceNotFoundError
  | ViewerIsProductOwnerError
  | ProductViewAlreadyExistsError,
  { productDetails: ProductDetailsDTO; viewerProfile: SellerProfileDTO }
>

@Injectable()
export class RegisterProductViewUseCase {
  constructor(
    private productViewsRepository: ProductViewsRepository,
    private productsRepository: ProductsRepository,
    private sellersRepository: SellersRepository,
    private categoriesRepository: CategoriesRepository,
    private attachmentsRepository: AttachmentsRepository,
    private productDetailsFactory: ProductDetailsFactory,
    private sellerProfileFactory: SellerProfileFactory,
    private sellerProfileMapper: SellerProfileMapper,
    private productDetailsMapper: ProductDetailsMapper,
  ) {}

  async execute({
    productId,
    viewerId,
  }: RegisterProductViewRequest): Promise<RegisterProductViewResponse> {
    const viewer = await this.sellersRepository.findById(viewerId)

    if (!viewer) {
      return left(new ResourceNotFoundError())
    }

    const product = await this.productsRepository.findById(productId)

    if (!product) {
      return left(new ResourceNotFoundError())
    }

    if (product.ownerId.equals(viewer.id)) {
      return left(new ViewerIsProductOwnerError())
    }

    const productViewAlreadyExists = await this.productViewsRepository.exists({
      productId,
      viewerId,
    })

    if (productViewAlreadyExists) {
      return left(new ProductViewAlreadyExistsError())
    }

    const [seller, category, attachments] = await Promise.all([
      this.sellersRepository.findById(product.ownerId.toString()),
      this.categoriesRepository.findById(product.categoryId.toString()),
      this.attachmentsRepository.findManyByIds(
        product.attachments
          .getItems()
          .map((attachment) => attachment.attachmentId.toString()),
      ),
    ])

    if (!seller || !category) {
      return left(new ResourceNotFoundError())
    }

    const productDetails = await this.productDetailsFactory.create({
      product,
      seller,
      category,
      attachments,
    })

    const productDetailsDTO = this.productDetailsMapper.toDTO(productDetails)

    const viewerProfile = await this.sellerProfileFactory.create({
      seller: viewer,
    })

    const viewerProfileDTO = this.sellerProfileMapper.toDTO(viewerProfile)

    const productView = ProductView.create({
      productId: UniqueEntityID.create({ value: productId }),
      viewerId: UniqueEntityID.create({ value: viewerId }),
    })

    await this.productViewsRepository.create(productView)

    return right({
      productDetails: productDetailsDTO,
      viewerProfile: viewerProfileDTO,
    })
  }
}
