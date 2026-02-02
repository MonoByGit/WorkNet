'use client'

import Link from 'next/link'
import { LayoutDashboard, MapPin, MonitorPlay, Settings, Layers, Menu, LogOut } from 'lucide-react'

interface SidebarProps {
    regions: { region: string }[]
}

export function Sidebar({ regions }: SidebarProps) {
    return (
        <aside className="w-64 border-r border-white/10 bg-black/80 backdrop-blur-xl h-screen sticky top-0 flex flex-col z-20">
            {/* Branding */}
            <div className="p-8 border-b border-white/5">
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-white">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Layers className="w-5 h-5 text-white" />
                    </div>
                    WorkNet
                </h1>
                <p className="text-xs text-center text-zinc-500 mt-2 tracking-widest uppercase">Studio 2.0</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-8">
                {/* Main Section */}
                <div>
                    <h3 className="px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">
                        Cockpit
                    </h3>
                    <ul className="space-y-1">
                        <li>
                            <Link
                                href="/studio"
                                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-300 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300 group"
                            >
                                <LayoutDashboard className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                                Dashboard
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/studio?filter=demo"
                                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-300 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300 group"
                            >
                                <MonitorPlay className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                                Demo Units
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Network Section */}
                <div>
                    <h3 className="px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">
                        Regions
                    </h3>
                    <ul className="space-y-1">
                        {regions.map((r, i) => (
                            <li key={i}>
                                <Link
                                    href={`/studio?region=${encodeURIComponent(r.region)}`}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300"
                                >
                                    <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                                    {r.region}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-white/5">
                <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-500 hover:text-white w-full rounded-2xl hover:bg-white/5 transition-colors">
                    <Settings className="w-4 h-4" />
                    Preferences
                </button>
                <button
                    onClick={async () => {
                        const { createClient } = await import('@/utils/supabase/client')
                        const supabase = createClient()
                        await supabase.auth.signOut()
                        window.location.href = '/login'
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500/60 hover:text-red-400 w-full rounded-2xl hover:bg-red-500/10 transition-colors mt-2"
                >
                    <LogOut className="w-4 h-4" />
                    Log Out
                </button>
            </div>
        </aside>
    )
}
