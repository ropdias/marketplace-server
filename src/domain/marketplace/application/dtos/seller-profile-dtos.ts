import { AttachmentDTO } from './attachment-dtos'

export interface SellerProfileDTO {
  sellerId: string
  name: string
  phone: string
  email: string
  avatar: AttachmentDTO | null
}
