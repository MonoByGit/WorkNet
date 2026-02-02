import Image from 'next/image'
import { Monitor, Map, Calendar, ExternalLink } from 'lucide-react'

interface AdCardProps {
    ad: {
        id: string
        internal_name: string
        background_image_url: string | null
        logo_url: string | null
        headline: string
        subtext: string | null
        season_tag: string | null
        advertiser: {
            name: string
            type: string | null
        } | null
        screen_assignments: {
            region_target: string | null
            specific_screen_id: string | null
        }[]
    }
}

export function AdCard({ ad }: AdCardProps) {
    // Determine targeting status
    const assignments = ad.screen_assignments || []
    const hasSpecificTarget = assignments.some(a => a.specific_screen_id)
    const regions = Array.from(new Set(assignments.map(a => a.region_target).filter(Boolean)))

    return (
        <div className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
            {/* Visual Preview Area */}
            <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                {ad.background_image_url ? (
                    // Note: In a real app we'd configure domains for next/image. 
                    // For now, using standard img tag if external URL to avoid config hassle in this prompt, or Next Image if local.
                    // Assuming Unsplash URLs, we can use a standard <img> for simplicity in this MVP step unless configured.
                    // Let's use <img> for robustness with random external URLs in MVP.
                    <img
                        src={ad.background_image_url}
                        alt={ad.headline}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
                        <span className="text-sm font-medium">No Image</span>
                    </div>
                )}

                {/* Overlays */}
                <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                    {hasSpecificTarget && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200/50 shadow-sm backdrop-blur-sm">
                            <Monitor className="w-3 h-3" />
                            Screen Override
                        </span>
                    )}
                    {regions.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200/50 shadow-sm backdrop-blur-sm">
                            <Map className="w-3 h-3" />
                            {regions.length === 1 ? regions[0] : `${regions.length} Regions`}
                        </span>
                    )}
                </div>
            </div>

            {/* Content Body */}
            <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            {ad.advertiser?.name || 'Unknown Advertiser'}
                        </p>
                        <h3 className="text-base font-bold text-gray-900 leading-tight">
                            {ad.headline}
                        </h3>
                    </div>
                    {ad.logo_url && (
                        <img src={ad.logo_url} alt="Logo" className="w-8 h-8 rounded-full border border-gray-100" />
                    )}
                </div>

                {ad.subtext && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                        {ad.subtext}
                    </p>
                )}

                {/* Footer Meta */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 mt-auto">
                    <div className="flex items-center gap-2">
                        {ad.season_tag && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                                <Calendar className="w-3 h-3" />
                                {ad.season_tag}
                            </span>
                        )}
                    </div>
                    <div className='flex gap-2'>
                        <button className='p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-900'>
                            <ExternalLink className='w-3.5 h-3.5' />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
