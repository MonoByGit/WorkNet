import { getRegions } from '@/actions/locations'
import { Sidebar } from '@/components/studio/Sidebar'

export default async function StudioLayout({
    children,
}: {
    children: React.ReactNode
}) {
    
    // Fetch distinct regions for the sidebar
    const uniqueRegions = await getRegions()

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
