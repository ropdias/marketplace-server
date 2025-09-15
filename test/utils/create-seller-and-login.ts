import { hash } from 'bcryptjs'
import { SellerFactory } from '../factories/make-seller'
import {
  Seller,
  SellerProps,
} from '@/domain/marketplace/enterprise/entities/seller'
import { JwtService } from '@nestjs/jwt'
import { JwtCookieService } from '@/infra/auth/jwt-cookie.service'

export function loginSellerWithCookie(seller: Seller, jwtService: JwtService) {
  const accessToken = jwtService.sign({ sub: seller.id.toString() })

  // For SuperTest, we only need the format: "access_token=value"
  const cookieString = `${JwtCookieService.ACCESS_TOKEN_COOKIE}=${accessToken}`

  return cookieString
}

export async function createSellerAndLoginWithCookie(
  sellerFactory: SellerFactory,
  jwtService: JwtService,
  data: Partial<SellerProps> = {},
): Promise<{ seller: Seller; cookieString: string }> {
  // 1. Create the seller in the database
  const seller = await sellerFactory.makePrismaSeller({
    ...data,
    password: data.password
      ? await hash(data.password, 10)
      : await hash('123456', 10),
  })

  const cookieString = loginSellerWithCookie(seller, jwtService)

  return { seller, cookieString }
}
