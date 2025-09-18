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
  ) {}

  async execute({
    productId,
    viewerId,
  }: RegisterProductViewRequest): Promise<RegisterProductViewResponse> {
    const viewerProfile =
      await this.sellersRepository.findSellerProfileById(viewerId)

    if (!viewerProfile) {
      return left(new ResourceNotFoundError('Seller not found.'))
    }

    const productDetails =
      await this.productsRepository.findProductDetailsById(productId)

    if (!productDetails) {
      return left(new ResourceNotFoundError('Product not found.'))
    }

    if (productDetails.owner.sellerId.equals(viewerProfile.sellerId)) {
      return left(new ViewerIsProductOwnerError())
    }

    const productViewAlreadyExists = await this.productViewsRepository.exists({
      productId,
      viewerId,
    })

    if (productViewAlreadyExists) {
      return left(new ProductViewAlreadyExistsError())
    }

    const productView = ProductView.create({
      productId: UniqueEntityID.create({ value: productId }),
      viewerId: UniqueEntityID.create({ value: viewerId }),
    })

    await this.productViewsRepository.create(productView)

    const viewerProfileDTO = SellerProfileMapper.toDTO(viewerProfile)
    const productDetailsDTO = ProductDetailsMapper.toDTO(productDetails)

    return right({
      productDetails: productDetailsDTO,
      viewerProfile: viewerProfileDTO,
    })
  }
}
