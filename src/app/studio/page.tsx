'use client'

// Switched to Server Action for data fetching
import { getAds } from '@/actions/ads'
import { BentoGrid } from '@/components/studio/BentoGrid'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Switched to Client Component to handle live refreshing and state easier for the "Dashboard" feel
// In a refined app, we'd use Server Actions + revalidatePath
export default function StudioPage() {
    const searchParams = useSearchParams()
    const [ads, setAds] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const regionFilter = searchParams.get('region') ?? undefined
    const isDemo = searchParams.get('filter') === 'demo'

    const fetchAds = async () => {
        setLoading(true)
        try {
            const data = await getAds({ region: regionFilter, isDemo })
            setAds(data)
        } catch (e) {
            console.error(e)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchAds()
    }, [regionFilter, isDemo])

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <header className="mb-10 flex items-end justify-between">
                <div>
                    <h2 className="text-zinc-500 uppercase tracking-widest text-xs font-bold mb-2">
                        {regionFilter ? `Region: ${regionFilter}` : 'Global Network'}
                    </h2>
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500">
                        {isDemo ? 'Demo Setup' : 'Active Campaigns'}
                    </h1>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-mono text-zinc-300">{ads.length}</p>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Running Ads</p>
                </div>
            </header>

            {loading ? (
                <div className="h-64 flex items-center justify-center text-zinc-600">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : (
                <BentoGrid ads={ads} onRefresh={fetchAds} />
            )}
        </div>
    )
}
