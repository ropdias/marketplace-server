import { hash } from 'bcryptjs'
import { SellerFactory } from '../factories/make-seller'
import { Seller } from '@/domain/marketplace/enterprise/entities/seller'
import { JwtService } from '@nestjs/jwt'
import { JwtCookieService } from '@/infra/auth/jwt-cookie.service'

export async function createSellerAndLogin(
  sellerFactory: SellerFactory,
  jwtService: JwtService,
  email = 'johndoe@example.com',
  password = '123456',
): Promise<{ seller: Seller; accessToken: string }> {
  // 1. Create the seller in the database
  const seller = await sellerFactory.makePrismaSeller({
    email,
    password: await hash(password, 10),
  })

  // 2. Generate the JWT token just like AuthenticateSellerUseCase does
  const accessToken = jwtService.sign({ sub: seller.id.toString() })

  return { seller, accessToken }
}

/**
 * Alternative version that returns the cookie formatted for SuperTest
 * Use this if you prefer to work directly with cookies
 */
export async function createSellerAndLoginWithCookie(
  sellerFactory: SellerFactory,
  jwtService: JwtService,
  email = 'johndoe@example.com',
  password = '123456',
): Promise<{ seller: Seller; cookieString: string }> {
  const { seller, accessToken } = await createSellerAndLogin(
    sellerFactory,
    jwtService,
    email,
    password,
  )

  // For SuperTest, we only need the format: "access_token=value"
  const cookieString = `${JwtCookieService.ACCESS_TOKEN_COOKIE}=${accessToken}`

  return { seller, cookieString }
}
