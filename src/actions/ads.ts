'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'

interface AdFilters {
  region?: string
  isDemo?: boolean
}

export async function getAds(filters?: AdFilters) {
  const where: Prisma.AdWhereInput = {}

  if (filters?.region) {
      where.assignments = {
          some: { regionTarget: filters.region }
      }
  }

  if (filters?.isDemo) {
      where.assignments = {
          some: { specificScreenId: { not: null } } // Rough logic for demo filtering based on original
      }
  }

  const ads = await prisma.ad.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
          advertiser: { select: { name: true, type: true } },
          assignments: true
      }
  })

  // Transform to match old shape if needed, or update frontend to match new shape
  // Prisma returns objects that are very similar to what we had.
  // We explicitly map to ensure serializability if needed, but simple objects are fine.
  return ads
}

interface UpdateAdData {
  headline?: string
  subtext?: string
  active?: boolean
  payment_status?: string
  promo_code?: string
  start_date?: string
  end_date?: string
}

export async function updateAd(id: string, data: UpdateAdData) {
  try {
      await prisma.ad.update({
          where: { id },
          data: {
              headline: data.headline,
              subtext: data.subtext,
              active: data.active,
              paymentStatus: data.payment_status, // Note camelCase mapping if needed (schema uses paymentStatus)
              promoCode: data.promo_code,
              startDate: data.start_date ? new Date(data.start_date) : undefined,
              endDate: data.end_date ? new Date(data.end_date) : undefined
          }
      })
      revalidatePath('/studio')
      return { success: true }
  } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to update ad:', e)
      }
      return { error: 'Failed to update ad' }
  }
}
