import { AdCard } from './AdCard'

interface AdGridProps {
    ads: any[] // Typing could be stricter sharing the type from AdCard, but 'any' allows flexibility with joins for now
}

export function AdGrid({ ads }: AdGridProps) {
    if (ads.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                <p>No ads found for this filter.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ads.map((ad) => (
                <AdCard key={ad.id} ad={ad} />
            ))}
        </div>
    )
}
