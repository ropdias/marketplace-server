import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { EnvService } from '../env/env.service'
import { EnvModule } from '../env/env.module'

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      imports: [EnvModule],
      inject: [EnvService],
      useFactory(env: EnvService) {
        const privateKey = env.get('JWT_PRIVATE_KEY')
        const publicKey = env.get('JWT_PUBLIC_KEY')

        return {
          signOptions: { algorithm: 'RS256' },
          privateKey: Buffer.from(privateKey, 'base64'),
          publicKey: Buffer.from(publicKey, 'base64'),
        }
      },
    }),
  ],
  providers: [],
})
export class AuthModule {}
