'use server'

import prisma from '@/lib/prisma'

export async function getRegions() {
  const locations = await prisma.location.findMany({
      select: { region: true },
      distinct: ['region'],
      orderBy: { region: 'asc' }
  })
  
  return locations
}
