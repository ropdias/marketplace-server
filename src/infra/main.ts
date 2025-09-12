import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { EnvService } from './env/env.service'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const env = app.get(EnvService)
  const port = env.get('PORT')

  const config = new DocumentBuilder()
    .setTitle('Marketplace API')
    .setDescription('API documentation for the Marketplace project')
    .setVersion('1.0')
    .addBearerAuth() // for JWT authentication
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
