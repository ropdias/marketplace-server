import { config } from 'dotenv'
import { PrismaClient } from '@/generated/prisma/client'
import { randomUUID } from 'node:crypto'
import { execSync } from 'node:child_process'
import { envSchema } from '@/infra/env/env'
import fs from 'fs'
import path from 'node:path'

config({ path: '.env', override: true })
config({ path: '.env.test', override: true })

const env = envSchema.parse(process.env)

let prisma: PrismaClient | null = null
let schemaId: string | null = null
let sqliteFilePath: string | null = null

function isPostgres(url: string) {
  return url.startsWith('postgresql://')
}

function isSQLite(url: string) {
  return url.startsWith('file:')
}

function generateUniqueDatabaseURL(schemaId: string) {
  const url = new URL(env.DATABASE_URL)
  url.searchParams.set('schema', schemaId)
  return url.toString()
}

beforeAll(() => {
  if (!env.DATABASE_URL) {
    throw new Error('Please provide a DATABASE_URL environment variable')
  }

  if (isPostgres(env.DATABASE_URL)) {
    schemaId = randomUUID()
    process.env.DATABASE_URL = generateUniqueDatabaseURL(schemaId)
    prisma = new PrismaClient()
  } else if (isSQLite(env.DATABASE_URL)) {
    sqliteFilePath = path.resolve(__dirname, `test-${randomUUID()}.db`)
    process.env.DATABASE_URL = `file:${sqliteFilePath}`
  }

  execSync('pnpm prisma migrate deploy')
})

afterAll(async () => {
  if (prisma) {
    if (schemaId && isPostgres(env.DATABASE_URL)) {
      // Drop schema PostgreSQL
      await prisma.$executeRawUnsafe(
        `DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`,
      )
    }

    await prisma.$disconnect()
  }

  // Cleanup SQLite file
  if (sqliteFilePath && fs.existsSync(sqliteFilePath)) {
    fs.unlinkSync(sqliteFilePath)
  }
})
