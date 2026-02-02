'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'react-qr-code'
import { getPlaylistForScreen, getScreenDetails } from '@/actions/screens'
import { Phone, Wifi, CloudOff } from 'lucide-react'

interface PlaybackScreenProps {
  screenId: string
}

export function PlaybackScreen({ screenId }: PlaybackScreenProps) {
  const [playlist, setPlaylist] = useState<any[]>([])
  const [screenInfo, setScreenInfo] = useState<any>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  const init = async () => {
    try {
      const [ads, screen] = await Promise.all([
        getPlaylistForScreen(screenId),
        getScreenDetails(screenId)
      ])
      setPlaylist(ads)
      setScreenInfo(screen)
    } catch (e) {
      console.error('Failed to init playback:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    init()
    const interval = setInterval(init, 5 * 60 * 1000) // Poll for new ads every 5 mins
    return () => clearInterval(interval)
  }, [screenId])

  useEffect(() => {
    if (playlist.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % playlist.length)
    }, 15000)
    return () => clearInterval(interval)
  }, [playlist])

  if (loading) return (
    <div className="h-screen bg-black text-white flex flex-col items-center justify-center">
      <Wifi className="w-12 h-12 animate-pulse mb-4 text-gray-500" />
      <h1 className="text-xl font-light tracking-widest">CONNECTING TO NETWORK...</h1>
    </div>
  )

  if (playlist.length === 0) return (
    <div className="h-screen bg-black text-white flex flex-col items-center justify-center">
      <CloudOff className="w-16 h-16 text-gray-600 mb-6" />
      <h1 className="text-3xl font-light mb-2 uppercase tracking-widest">No Content Assigned</h1>
      <p className="text-zinc-500 font-mono text-sm">
        {screenInfo?.deviceName} • {screenInfo?.location?.region}
      </p>
    </div>
  )

  const currentAd = playlist[currentIndex]

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAd.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* Background */}
          {currentAd.bgUrl ? (
            <img
              src={currentAd.bgUrl}
              className="w-full h-full object-cover opacity-80"
              alt="Background"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-black" />
          )}

          {/* Glass Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-20 pb-24">
            {currentAd.logoUrl && (
              <div className="absolute top-12 right-12">
                <img src={currentAd.logoUrl} className="w-24 h-24 object-contain" alt="Logo" />
              </div>
            )}

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="max-w-4xl"
            >
              <h3 className="text-blue-400 font-bold uppercase tracking-widest mb-4">
                {currentAd.advertiser?.name}
              </h3>
              <h1 className="text-7xl font-bold text-white mb-6 leading-tight">
                {currentAd.headline}
              </h1>
              <p className="text-3xl text-zinc-300 font-light max-w-2xl leading-relaxed">
                {currentAd.subtext}
              </p>
            </motion.div>

            {/* CTAs */}
            {(currentAd.ctaType === 'qr' || currentAd.ctaType === 'phone') && (
              <div className="absolute bottom-20 right-20 bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl flex items-center gap-8">
                {currentAd.ctaType === 'qr' && (
                  <>
                    <div className="bg-white p-3 rounded-2xl shadow-xl">
                      <QRCode value={currentAd.ctaValue || ''} size={110} />
                    </div>
                    <div>
                      <p className="text-white text-xl font-medium mb-1">Scan for Info</p>
                      <p className="text-zinc-500 text-sm">Open camera app</p>
                    </div>
                  </>
                )}

                {currentAd.ctaType === 'phone' && (
                  <div className="flex items-center gap-8 px-4">
                    <div className="bg-blue-500/20 p-5 rounded-3xl shadow-lg border border-blue-500/30">
                      <Phone className="w-12 h-12 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-zinc-500 text-sm uppercase tracking-widest mb-2 font-bold">Call Now</p>
                      <p className="text-5xl font-bold text-white tracking-widest leading-none">
                        {currentAd.ctaValue}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 h-2 bg-white/5 w-full">
        <motion.div
          key={currentIndex}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 15, ease: "linear" }}
          className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
        />
      </div>
    </div>
  )
}
