'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Clock, Trash2, CreditCard, Calendar, Tag } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface InspectorPanelProps {
    ad: any
    onClose: () => void
    onUpdate: () => void // Callback to refresh parent data
}

export function InspectorPanel({ ad, onClose, onUpdate }: InspectorPanelProps) {
    const supabase = createClient()
    const [formData, setFormData] = useState({
        headline: '',
        subtext: '',
        active: true,
        payment_status: 'paid',
        promo_code: '' as string | null,
        start_date: '' as string | null,
        end_date: '' as string | null,
        // week_schedule: [] // MVP omitted for brevity
    })
    const [saving, setSaving] = useState(false)

    // Load initial data
    useEffect(() => {
        if (ad) {
            setFormData({
                headline: ad.headline || '',
                subtext: ad.subtext || '',
                active: ad.active,
                payment_status: ad.payment_status || 'paid',
                promo_code: ad.promo_code || '',
                start_date: ad.start_date || '',
                end_date: ad.end_date || '',
            })
        }
    }, [ad])

    const handleSave = async () => {
        setSaving(true)
        const updates = {
            headline: formData.headline,
            subtext: formData.subtext,
            active: formData.active,
            payment_status: formData.payment_status,
            promo_code: formData.promo_code || null,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null
        }

        const { error } = await supabase
            .from('wn_ads')
            .update(updates)
            .eq('id', ad.id)

        setSaving(false)
        if (!error) {
            onUpdate()
            onClose()
        } else {
            alert('Error updating ad: ' + error.message)
        }
    }

    // Live Preview Component (Mini Player)
    const renderPreview = () => (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 group">
            {/* Background */}
            {ad.background_image_url ? (
                <img src={ad.background_image_url} className="w-full h-full object-cover opacity-80" />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900" />
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            {/* Content */}
            <div className="absolute bottom-6 left-6 right-6">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">{ad.advertiser?.name}</p>
                <h2 className="text-xl font-bold text-white leading-tight mb-1">{formData.headline}</h2>
                <p className="text-xs text-zinc-400 line-clamp-2">{formData.subtext}</p>
            </div>
        </div>
    )

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-zinc-950/90 backdrop-blur-2xl border-l border-white/10 shadow-2xl z-50 flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div>
                    <h2 className="text-lg font-bold text-white">Inspector</h2>
                    <p className="text-xs text-zinc-500 font-mono uppercase">{ad.id.split('-')[0]} • {ad.advertiser?.name}</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                {/* 1. Preview */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Live Preview</label>
                    {renderPreview()}
                </div>

                {/* 2. Status & Payment */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Active Toggle */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-zinc-400 flex items-center gap-2"><Clock className="w-3 h-3" /> Status</span>
                            <div onClick={() => setFormData({ ...formData, active: !formData.active })} className={`w-10 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors ${formData.active ? 'bg-green-500' : 'bg-zinc-700'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.active ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                        </div>
                        <p className="text-xs text-zinc-500">{formData.active ? 'Currently Active' : 'Suspended'}</p>
                    </div>

                    {/* Payment Status */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                        <label className="text-xs text-zinc-400 flex items-center gap-2 mb-2"><CreditCard className="w-3 h-3" /> Payment</label>
                        <select
                            value={formData.payment_status}
                            onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg text-sm text-white px-2 py-1.5 focus:outline-none focus:border-blue-500"
                        >
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                            <option value="overdue">Overdue</option>
                        </select>
                    </div>
                </div>

                {/* 3. Content Editing */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">Content</h3>

                    <div className="space-y-1">
                        <label className="text-xs text-zinc-400">Headline</label>
                        <input
                            type="text"
                            value={formData.headline}
                            onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-zinc-700"
                            placeholder="Enter headline..."
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-zinc-400">Subtext</label>
                        <textarea
                            value={formData.subtext}
                            onChange={(e) => setFormData({ ...formData, subtext: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-zinc-700 min-h-[80px]"
                            placeholder="Enter subtext..."
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-zinc-400 flex items-center gap-2"><Tag className="w-3 h-3" /> Promo Code</label>
                        <input
                            type="text"
                            value={formData.promo_code || ''}
                            onChange={(e) => setFormData({ ...formData, promo_code: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                            placeholder="SUMMER2026"
                        />
                    </div>
                </div>

                {/* 4. Scheduling (Simplified) */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">Schedule</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-zinc-400 mb-1 block">Start Date</label>
                            <input type="date" value={formData.start_date || ''} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs" />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400 mb-1 block">End Date</label>
                            <input type="date" value={formData.end_date || ''} onChange={e => setFormData({ ...formData, end_date: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs" />
                        </div>
                    </div>
                </div>

            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/5 bg-zinc-950/50 backdrop-blur-md flex items-center justify-between">
                <button className="text-red-400 hover:text-red-300 text-sm flex items-center gap-2 transition-colors">
                    <Trash2 className="w-4 h-4" /> Delete
                </button>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-white text-black hover:bg-zinc-200 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg hover:scale-105 disabled:opacity-50"
                >
                    {saving ? <div className='w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin' /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>
        </motion.div>
    )
}
