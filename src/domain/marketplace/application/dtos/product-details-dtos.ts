import { AttachmentDTO } from './attachment-dtos'
import { CategoryDTO } from './category-dtos'
import { SellerProfileDTO } from './seller-profile-dtos'

export interface ProductDetailsDTO {
  productId: string
  title: string
  description: string
  priceInCents: number
  status: string
  owner: SellerProfileDTO
  category: CategoryDTO
  attachments: AttachmentDTO[]
}
