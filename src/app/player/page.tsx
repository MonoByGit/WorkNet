'use client'

import { useState, useEffect } from 'react'
import { PairingScreen } from '@/components/player/PairingScreen'
import { PlaybackScreen } from '@/components/player/PlaybackScreen'

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

    if (!mounted) return null // Prevent hydration mismatch

    if (!screenId) {
        return <PairingScreen onPaired={(id) => setScreenId(id)} />
    }

    return <PlaybackScreen screenId={screenId} />
}
