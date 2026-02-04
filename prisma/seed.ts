import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // 1. Admin User
  // Default development password: WorkNet2026!Secure
  // IMPORTANT: Change this password after first login in production!
  const password = await bcrypt.hash('WorkNet2026!Secure', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@worknet.com' },
    update: {},
    create: {
      email: 'admin@worknet.com',
      name: 'WorkNet Admin',
      password,
      role: 'admin',
    },
  })
  if (process.env.NODE_ENV === 'development') {
    console.log({ admin })
  }

  // 2. Regions (Locations)
  const regions = ['Amsterdam-Zuid', 'Utrecht Heuvelrug', 'Rotterdam Centrum', 'Eindhoven Strijp']
  
  // Create Locations
  const locations = []
  for (let i = 1; i <= 20; i++) {
     const region = regions[Math.floor(Math.random() * regions.length)]
     const type = i <= 10 ? 'kapper' : (i <= 15 ? 'medisch' : 'salon')
     const name = type === 'kapper' ? `Barber District ${i}` : (type === 'medisch' ? `Fysio Fit ${i}` : `Wellness Spa ${i}`)
     
     const loc = await prisma.location.create({
       data: {
          name,
          type,
          address: `Hoofdstraat ${i}`,
          region,
          screens: {
             create: {
                 deviceName: `SCREEN-${1000 + i}`,
                 status: Math.random() > 0.1 ? 'online' : 'offline'
             }
          }
       },
       include: { screens: true }
     })
     locations.push(loc)
  }

  // 3. Demo Unit (HQ)
  const demoLoc = await prisma.location.create({
     data: {
        name: 'WorkNet HQ Demo',
        type: 'hq',
        region: 'Amsterdam-Zuid',
        isDemo: true,
        screens: {
            create: Array.from({length: 6}).map((_, j) => ({
                deviceName: `DEMO UNIT 0${j+1}`,
                status: 'online',
                isDemo: true
            }))
        }
     }
  })

  // 4. Advertisers & Ads
  // Hovenier (Global)
  const hovenier = await prisma.advertiser.create({
     data: {
        name: 'Hovenier Groen',
        type: 'service',
        status: 'active',
        ads: {
            create: {
                internalName: 'Winter Snoei',
                headline: 'Uw tuin winterklaar?',
                subtext: 'Wij snoeien uw bomen en struiken.',
                seasonTag: 'winter',
                assignments: {
                    create: { regionTarget: 'Utrecht Heuvelrug' }
                }
            }
        }
     }
  })

  // Garage (All Regions)
  const garage = await prisma.advertiser.create({
     data: {
        name: 'Garage Jansen',
        type: 'automotive',
        status: 'active',
        ads: {
            create: {
                internalName: 'Winterbanden',
                headline: 'Is uw auto veilig?',
                subtext: 'Maak nu een afspraak voor de wissel.',
                seasonTag: 'winter',
                ctaType: 'phone',
                ctaValue: '020-12345678',
                assignments: {
                    create: regions.map(r => ({ regionTarget: r }))
                }
            }
        }
     }
  })
  
  // Validating Hovenier assignment
  // Note: assignments logic here is basic, in real logic we iterate regions.
  // The above garage map relies on nested create for relation, which is valid in Prisma.

  console.log('✅ Seed complete')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
