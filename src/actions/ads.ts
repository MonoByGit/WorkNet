'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function getAds(filters?: { region?: string, isDemo?: boolean }) {
  const where: any = {}

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

export async function updateAd(id: string, data: any) {
  try {
      await prisma.ad.update({
          where: { id },
          data: {
              headline: data.headline,
              subtext: data.subtext,
              active: data.active,
              paymentStatus: data.payment_status, // Note camelCase mapping if needed (schema uses paymentStatus)
              promoCode: data.promo_code,
              startDate: data.start_date ? new Date(data.start_date) : null,
              endDate: data.end_date ? new Date(data.end_date) : null
          }
      })
      revalidatePath('/studio')
      return { success: true }
  } catch (e) {
      console.error(e)
      return { error: 'Failed to update ad' }
  }
}
