'use server'

import prisma from '@/lib/prisma'

export async function getScreens() {
  return await prisma.screen.findMany({
      orderBy: { deviceName: 'asc' },
      include: {
          location: { select: { name: true, region: true } }
      }
  })
}

export async function getScreenDetails(id: string) {
    return await prisma.screen.findUnique({
        where: { id },
        include: { location: { select: { region: true, name: true } } }
    })
}

export async function getPlaylistForScreen(screenId: string) {
    // 1. Get Screen Info
    const screen = await prisma.screen.findUnique({
        where: { id: screenId },
        include: { location: true }
    })

    if (!screen) return []

    // 2. Fetch Ads based on Assignments
    // Logic: Specific ID OR (Region Target + No Specific ID)
    const assignments = await prisma.assignment.findMany({
        where: {
            OR: [
                { specificScreenId: screenId },
                { 
                    regionTarget: screen.location.region, 
                    specificScreenId: null 
                }
            ]
        },
        include: {
            ad: {
                include: { advertiser: true }
            }
        },
        orderBy: { priority: 'desc' }
    })

    // 3. Filter active ads only
    const activeAds = assignments
        .map(a => a.ad)
        .filter(ad => ad.active)
    
    return activeAds
}
