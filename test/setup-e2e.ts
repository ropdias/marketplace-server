import { config } from 'dotenv'
import { PrismaClient } from '@/generated/prisma/client'
import { randomUUID } from 'node:crypto'
import { execSync } from 'node:child_process'
import { envSchema } from '@/infra/env/env'
import fs from 'fs'

config({ path: '.env', override: true })
config({ path: '.env.test', override: true })

const env = envSchema.parse(process.env)

let prisma: PrismaClient | null = null
let schemaId: string | null = null

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
    process.env.DATABASE_URL = env.DATABASE_URL
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
  if (isSQLite(process.env.DATABASE_URL!)) {
    const match = process.env.DATABASE_URL!.match(/^file:\s*(?!:memory:)(.+)$/)

    if (match) {
      const filePath = match[1].trim()
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }
  }
})
