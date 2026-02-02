'use server'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function getRegions() {
  const locations = await prisma.location.findMany({
      select: { region: true },
      distinct: ['region'],
      orderBy: { region: 'asc' }
  })
  
  return locations
}
