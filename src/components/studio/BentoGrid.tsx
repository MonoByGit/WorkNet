'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { InspectorPanel } from './InspectorPanel'
import { Monitor, Map, Info, AlertCircle, CheckCircle } from 'lucide-react'

// --- Types ---
interface Ad {
    id: string
    internal_name: string
    background_image_url: string | null
    headline: string
    subtext: string | null
    active: boolean
    payment_status?: string
    start_date?: string
    end_date?: string
    advertiser: { name: string } | null
    screen_assignments: any[]
}

interface BentoGridProps {
    ads: Ad[]
    onRefresh: () => void
}

// --- Status Dot Component ---
function StatusIndicator({ active, payment }: { active: boolean, payment?: string }) {
    if (payment === 'overdue') return <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" title="Payment Overdue" />
    if (!active) return <div className="w-2.5 h-2.5 rounded-full bg-zinc-600 border border-zinc-500" title="Inactive" />
    return <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" title="Active & Paid" />
}

// --- Card Component ---
function BentoCard({ ad, onClick }: { ad: Ad, onClick: () => void }) {
    const isOverdue = ad.payment_status === 'overdue'

    return (
        <motion.div
            layoutId={`card-${ad.id}`}
            onClick={onClick}
            whileHover={{ scale: 1.02, y: -2 }}
            className={`relative group cursor-pointer overflow-hidden rounded-3xl border transition-colors duration-300 ${isOverdue ? 'border-red-500/30 bg-red-900/10' : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'}`}
        >
            {/* Image / Background */}
            <div className="absolute inset-x-0 top-0 h-2/3 opacity-60 group-hover:opacity-80 transition-opacity">
                {ad.background_image_url ? (
                    <img src={ad.background_image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </div>

            {/* Status Top Right */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                {/* Chips */}
                {ad.screen_assignments?.some(a => a.specific_screen_id) && (
                    <div className="px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold text-amber-500 uppercase">Override</div>
                )}
                <StatusIndicator active={ad.active} payment={ad.payment_status} />
            </div>

            {/* Content Bottom */}
            <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end h-full">
                <div className="mt-auto">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-1">{ad.advertiser?.name}</p>
                    <h3 className="text-lg font-bold text-white leading-tight mb-2 group-hover:text-blue-400 transition-colors">{ad.headline}</h3>
                    {ad.start_date && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <Info className="w-3 h-3" />
                            <span>{new Date(ad.start_date).toLocaleDateString()} &rarr; {ad.end_date ? new Date(ad.end_date).toLocaleDateString() : '∞'}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Overdue Warning Overlay */}
            {isOverdue && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none group-hover:bg-black/20 transition-all">
                    <div className="flex flex-col items-center text-red-500">
                        <AlertCircle className="w-8 h-8 mb-2" />
                        <span className="text-xs font-bold uppercase tracking-widest">Payment Required</span>
                    </div>
                </div>
            )}
        </motion.div>
    )
}

// --- Main Grid ---
export function BentoGrid({ ads, onRefresh }: BentoGridProps) {
    const [selectedAd, setSelectedAd] = useState<Ad | null>(null)

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[320px]">
                <AnimatePresence>
                    {ads.map((ad) => (
                        <BentoCard key={ad.id} ad={ad} onClick={() => setSelectedAd(ad)} />
                    ))}
                </AnimatePresence>

                {/* Add New Button (Placeholder) */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="rounded-3xl border border-dashed border-white/10 bg-transparent flex flex-col items-center justify-center text-zinc-600 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer min-h-[320px]"
                >
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 text-3xl font-light">+</div>
                    <span className="text-sm font-medium">Create Campaign</span>
                </motion.div>
            </div>

            {/* Slide Over Inspector */}
            <AnimatePresence>
                {selectedAd && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                            onClick={() => setSelectedAd(null)}
                        />
                        <InspectorPanel
                            ad={selectedAd}
                            onClose={() => setSelectedAd(null)}
                            onUpdate={onRefresh} // This triggers a router.refresh() usually in parent
                        />
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
