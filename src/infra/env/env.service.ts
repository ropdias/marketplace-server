import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Env } from './env'

@Injectable()
export class EnvService {
  // By default on Nest all .env variables can be undefined.
  // But ConfigService<Env, true> means the type of ConfigService is Env and
  // WasValidated=true so none of the variables inside will be undefined
  constructor(private configService: ConfigService<Env, true>) {}

  get<T extends keyof Env>(key: T) {
    return this.configService.get(key, { infer: true })
  }
}
