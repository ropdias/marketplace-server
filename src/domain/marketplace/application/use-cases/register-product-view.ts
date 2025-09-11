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
import { SellerProfileAssembler } from '../assemblers/seller-profile-assembler'
import { ProductDetailsAssembler } from '../assemblers/product-details-assembler'

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
    private sellerProfileAssembler: SellerProfileAssembler,
    private productDetailsAssembler: ProductDetailsAssembler,
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

    const productDetailsEither = await this.productDetailsAssembler.assemble({
      product,
    })
    if (productDetailsEither.isLeft()) return left(productDetailsEither.value)

    const productDetailsDTO = ProductDetailsMapper.toDTO(
      productDetailsEither.value,
    )

    const viewerProfileEither = await this.sellerProfileAssembler.assemble({
      seller: viewer,
    })
    if (viewerProfileEither.isLeft()) return left(viewerProfileEither.value)

    const viewerProfileDTO = SellerProfileMapper.toDTO(
      viewerProfileEither.value,
    )

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
