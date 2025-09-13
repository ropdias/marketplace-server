import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { EnvService } from './env/env.service'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
import cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const env = app.get(EnvService)
  const port = env.get('PORT')

  app.enableCors({
    origin: env.get('FRONTEND_URL'),
    credentials: true,
  })

  app.use(cookieParser())

  const config = new DocumentBuilder()
    .setTitle('Marketplace API')
    .setDescription('API documentation for the Marketplace project')
    .setVersion('1.0')
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
      description: 'JWT token stored in httpOnly cookie',
    })
    .build()

  const document = SwaggerModule.createDocument(app, config)

  app.use(
    '/reference',
    apiReference({
      content: document,
    }),
  )

  await app.listen(port)
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap()
