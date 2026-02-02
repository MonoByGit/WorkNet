'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { AnimatePresence, motion } from 'framer-motion'
import QRCode from 'react-qr-code'
import { Phone, Wifi, CloudOff } from 'lucide-react'

interface PlaybackScreenProps {
    screenId: string
}

export function PlaybackScreen({ screenId }: PlaybackScreenProps) {
    const supabase = createClient()
    const [playlist, setPlaylist] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [screenInfo, setScreenInfo] = useState<any>(null)

    // 1. Fetch Screen Info & Playlist
    useEffect(() => {
        async function init() {
            // Get Screen details (Region is crucial)
            const { data: screen } = await supabase
                .from('wn_screens')
                .select('*, wn_locations(region, name)')
                .eq('id', screenId)
                .single()

            if (!screen) return
            setScreenInfo(screen)

            const region = screen.wn_locations?.region

            // Get Assignments
            // Logic: Specific ID match OR (Region Match AND Specific ID is Null)
            // Supabase JS client doesn't support complex ORs across joined tables easily in one go efficiently without multiple queries or views.
            // We will fetch ALL assignments that match either criteria separately or fetch broader set and filter.
            // Let's try separate queries for clarity in this generated code and merge.

            // A. Specific Assignments
            const { data: specific } = await supabase
                .from('wn_screen_assignments')
                .select('*, ad:wn_ads(*, advertiser:wn_advertisers(name))')
                .eq('specific_screen_id', screenId)

            // B. Region Assignments
            const { data: regionAds } = await supabase
                .from('wn_screen_assignments')
                .select('*, ad:wn_ads(*, advertiser:wn_advertisers(name))')
                .eq('region_target', region)
                .is('specific_screen_id', null) // Only generalized ads

            // Merge unique ads
            let combined = [...(specific || []), ...(regionAds || [])]

            // Sort: Priority (descending) -> then maybe random or created_at
            combined.sort((a, b) => (b.priority || 0) - (a.priority || 0))

            // Extract Ads
            const ads = combined.map(c => c.ad).filter(ad => ad.active)

            setPlaylist(ads)
            setLoading(false)
        }

        init()

        // Refresh playlist every 5 minutes (simple polling)
        const interval = setInterval(init, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [screenId])

    // 2. Playback Loop
    useEffect(() => {
        if (playlist.length <= 1) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % playlist.length)
        }, 15000) // 15 seconds

        return () => clearInterval(interval)
    }, [playlist])

    // Render Loading
    if (loading) return (
        <div className="h-screen bg-black text-white flex flex-col items-center justify-center">
            <Wifi className="w-12 h-12 animate-pulse mb-4 text-gray-500" />
            <h1 className="text-xl font-light">Loading Network...</h1>
        </div>
    )

    // Render Empty State
    if (playlist.length === 0) return (
        <div className="h-screen bg-black text-white flex flex-col items-center justify-center">
            <CloudOff className="w-16 h-16 text-gray-600 mb-6" />
            <h1 className="text-3xl font-light mb-2">No Content Available</h1>
            <p className="text-gray-500">{screenInfo?.device_name} • {screenInfo?.wn_locations?.region}</p>
        </div>
    )

    const currentAd = playlist[currentIndex]

    // Render Player
    return (
        <div className="relative h-screen w-screen bg-black overflow-hidden font-sans">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={currentAd.id}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    {/* Background */}
                    {currentAd.background_image_url ? (
                        <img
                            src={currentAd.background_image_url}
                            className="w-full h-full object-cover opacity-80"
                            alt="bg"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800" />
                    )}

                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                    {/* Content Container */}
                    <div className="absolute inset-0 flex flex-col justify-end p-20 pb-24">
                        {/* Top Right Logo if present */}
                        {currentAd.logo_url && (
                            <div className="absolute top-12 right-12">
                                <img src={currentAd.logo_url} className="w-24 h-24 object-contain" />
                            </div>
                        )}

                        {/* Main Text */}
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="max-w-4xl"
                        >
                            <h3 className="text-blue-400 font-bold uppercase tracking-widest mb-4 flex items-center gap-3">
                                {currentAd.advertiser?.name}
                            </h3>
                            <h1 className="text-7xl font-bold text-white mb-6 leading-tight">
                                {currentAd.headline}
                            </h1>
                            <p className="text-3xl text-gray-300 font-light max-w-2xl leading-normal">
                                {currentAd.subtext}
                            </p>
                        </motion.div>

                        {/* CTA Area (Smart Render) */}
                        {(currentAd.cta_type === 'qr' || currentAd.cta_type === 'phone') && (
                            <div className="absolute bottom-20 right-20 bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl flex items-center gap-8">
                                {currentAd.cta_type === 'qr' && (
                                    <>
                                        <div className="bg-white p-2 rounded-xl">
                                            <QRCode value={currentAd.cta_value || ''} size={120} />
                                        </div>
                                        <div className="text-white text-right">
                                            <p className="text-lg font-medium opacity-80 mb-1">Scan voor info</p>
                                            <p className="text-sm opacity-50">Open camera app</p>
                                        </div>
                                    </>
                                )}

                                {currentAd.cta_type === 'phone' && (
                                    <div className="flex items-center gap-6 px-4">
                                        <div className="bg-green-500/20 p-4 rounded-full">
                                            <Phone className="w-10 h-10 text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm uppercase tracking-wider text-gray-400 mb-1">Bel direct</p>
                                            <p className="text-4xl font-bold text-white tracking-widest">{currentAd.cta_value}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Progress Bar (Optional nice touch) */}
            <div className="absolute bottom-0 left-0 h-1.5 bg-white/20 w-full">
                <motion.div
                    key={currentIndex}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 15, ease: "linear" }}
                    className="h-full bg-blue-500"
                />
            </div>
        </div>
    )
}
