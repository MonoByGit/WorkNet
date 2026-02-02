'use client'

// Player Page - Client Component handling LocalStorage pairing
import { useEffect, useState } from 'react'
import { PairingScreen } from '@/components/player/PairingScreen'
import { PlaybackScreen } from '@/components/player/PlaybackScreen'
import { Loader2 } from 'lucide-react'

export default function PlayerPage() {
  const [screenId, setScreenId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('wn_screen_id')
    if (stored) {
      setScreenId(stored)
    }
  }, [])

  if (!mounted) {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
    )
  }

  if (!screenId) {
    return <PairingScreen onPaired={(id) => setScreenId(id)} />
  }

  return <PlaybackScreen screenId={screenId} />
}
