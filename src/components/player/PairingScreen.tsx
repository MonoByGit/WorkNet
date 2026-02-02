'use client'

import { useState, useEffect } from 'react'
import { Monitor, Save, RefreshCw, Check } from 'lucide-react'
import { getScreens } from '@/actions/screens'

interface PairingScreenProps {
    onPaired: (screenId: string) => void
}

export function PairingScreen({ onPaired }: PairingScreenProps) {
    const [screens, setScreens] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedScreenId, setSelectedScreenId] = useState('')

    useEffect(() => {
        fetchScreens()
    }, [])

    const fetchScreens = async () => {
        setLoading(true)
        try {
            const data = await getScreens()
            setScreens(data)
        } catch (e) {
            console.error(e)
        }
        setLoading(false)
    }

    const handleSave = () => {
        if (!selectedScreenId) return
        localStorage.setItem('wn_screen_id', selectedScreenId)
        onPaired(selectedScreenId)
    }

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Monitor className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Player Setup</h2>
                    <p className="text-gray-500 text-center mt-2">
                        Select which screen this device is representing.
                    </p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Screen
                        </label>
                        <select
                            value={selectedScreenId}
                            onChange={(e) => setSelectedScreenId(e.target.value)}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 text-base bg-gray-50"
                            disabled={loading}
                        >
                            <option value="">-- Choose a Screen --</option>
                            {screens.map((screen) => (
                                <option key={screen.id} value={screen.id}>
                                    {screen.device_name} ({screen.wn_locations?.name})
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={!selectedScreenId}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-5 h-5" />
                        Save Configuration
                    </button>

                    <div className='flex justify-center'>
                        <button onClick={fetchScreens} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> Refresh List
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
