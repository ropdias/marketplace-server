import { describe, it, expect } from 'vitest'
import { $Enums } from '@/generated/prisma/client'
import { ProductStatusEnum } from '@/domain/marketplace/enterprise/entities/value-objects/product-status'
import { PrismaProductStatusMapper } from './prisma-product-status-mapper'

describe('PrismaProductStatusMapper', () => {
  describe('toDomain', () => {
    it('should convert AVAILABLE status from Prisma to domain', () => {
      const prismaStatus: $Enums.ProductStatus = 'AVAILABLE'
      const domainStatus = PrismaProductStatusMapper.toDomain(prismaStatus)

      expect(domainStatus).toBe(ProductStatusEnum.AVAILABLE)
    })

    it('should convert CANCELLED status from Prisma to domain', () => {
      const prismaStatus: $Enums.ProductStatus = 'CANCELLED'
      const domainStatus = PrismaProductStatusMapper.toDomain(prismaStatus)

      expect(domainStatus).toBe(ProductStatusEnum.CANCELLED)
    })

    it('should convert SOLD status from Prisma to domain', () => {
      const prismaStatus: $Enums.ProductStatus = 'SOLD'
      const domainStatus = PrismaProductStatusMapper.toDomain(prismaStatus)

      expect(domainStatus).toBe(ProductStatusEnum.SOLD)
    })
  })

  describe('toPrisma', () => {
    it('should convert AVAILABLE status from domain to Prisma', () => {
      const domainStatus = ProductStatusEnum.AVAILABLE
      const prismaStatus = PrismaProductStatusMapper.toPrisma(domainStatus)

      expect(prismaStatus).toBe('AVAILABLE')
    })

    it('should convert CANCELLED status from domain to Prisma', () => {
      const domainStatus = ProductStatusEnum.CANCELLED
      const prismaStatus = PrismaProductStatusMapper.toPrisma(domainStatus)

      expect(prismaStatus).toBe('CANCELLED')
    })

    it('should convert SOLD status from domain to Prisma', () => {
      const domainStatus = ProductStatusEnum.SOLD
      const prismaStatus = PrismaProductStatusMapper.toPrisma(domainStatus)

      expect(prismaStatus).toBe('SOLD')
    })
  })

  describe('bidirectional conversion', () => {
    it('should maintain consistency when converting from domain to Prisma and back', () => {
      const originalDomainStatus = ProductStatusEnum.AVAILABLE
      const prismaStatus =
        PrismaProductStatusMapper.toPrisma(originalDomainStatus)
      const backToDomainStatus =
        PrismaProductStatusMapper.toDomain(prismaStatus)

      expect(backToDomainStatus).toBe(originalDomainStatus)
    })

    it('should maintain consistency when converting from Prisma to domain and back', () => {
      const originalPrismaStatus: $Enums.ProductStatus = 'SOLD'
      const domainStatus =
        PrismaProductStatusMapper.toDomain(originalPrismaStatus)
      const backToPrismaStatus =
        PrismaProductStatusMapper.toPrisma(domainStatus)

      expect(backToPrismaStatus).toBe(originalPrismaStatus)
    })
  })
})
