import { createClient } from '@/utils/supabase/server'
import { Sidebar } from '@/components/studio/Sidebar'

export default async function StudioLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    // Fetch distinct regions for the sidebar
    const { data: locations } = await supabase
        .from('wn_locations') // Updated table name
        .select('region')

    // Unique regions logic
    const regionsRaw = locations?.map((l: any) => l.region).filter(Boolean) || []
    const uniqueRegions = Array.from(new Set(regionsRaw))
        .map((r: any) => ({ region: r }))
        .sort((a: any, b: any) => a.region.localeCompare(b.region))

    return (
        <div className="flex min-h-screen bg-black">
            <Sidebar regions={uniqueRegions} />
            <main className="flex-1 overflow-auto h-screen bg-black relative">
                {/* Global ambient glow effect */}
                <div className="absolute top-0 left-0 w-full h-96 bg-blue-900/10 blur-[100px] pointer-events-none" />

                {/* Content */}
                <div className="relative z-10">
                    {children}
                </div>
            </main>
        </div>
    )
}
