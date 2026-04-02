'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Globe, Lock, Play, Users } from 'lucide-react'
import { client } from '@/lib/axios'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/authStore'
import { cn } from '@/lib/utils'

function NewRoomForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuthStore()
  const mediaId = searchParams.get('mediaId') || ''
  const [isPublic, setIsPublic] = useState(true)
  const [maxViewers, setMaxViewers] = useState(50)
  const [roomName, setRoomName] = useState('')
  const [loading, setLoading] = useState(false)
  const [mediaTitle, setMediaTitle] = useState('')

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return }
    if (mediaId) {
      client.get(api.media.detail(mediaId)).then(r => {
        setMediaTitle(r.data.title)
        if (!roomName) setRoomName(`${r.data.title} Watch Party`)
      }).catch(() => {})
    }
  }, [isAuthenticated, router, mediaId])

  const handleCreate = async () => {
    if (!mediaId) return
    setLoading(true)
    try {
      const res = await client.post(api.rooms.create, { mediaId, isPublic, name: roomName || `${mediaTitle} Watch Party`, maxViewers })
      router.push(`/watch/${res.data._id}`)
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-16 px-4">
      <div className="w-full max-w-md glass-card p-8 animate-slide-up">
        <h1 className="text-2xl font-bold text-text mb-2">Create Watch Party</h1>
        <p className="text-text-secondary mb-6">{mediaTitle || 'Select media first'}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Room Name</label>
            <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} className="input-field" placeholder="My Watch Party" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Visibility</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setIsPublic(true)} className={cn('p-3 rounded-lg border transition-all text-left', isPublic ? 'border-accent bg-accent/10' : 'border-border bg-bg-elevated')}>
                <Globe className="w-5 h-5 text-accent mb-1" /><p className="text-sm font-medium text-text">Public</p><p className="text-xs text-text-muted">Anyone can join</p>
              </button>
              <button onClick={() => setIsPublic(false)} className={cn('p-3 rounded-lg border transition-all text-left', !isPublic ? 'border-accent bg-accent/10' : 'border-border bg-bg-elevated')}>
                <Lock className="w-5 h-5 text-text-muted mb-1" /><p className="text-sm font-medium text-text">Private</p><p className="text-xs text-text-muted">Invite only</p>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Max Viewers: {maxViewers}</label>
            <input type="range" min="2" max="200" value={maxViewers} onChange={(e) => setMaxViewers(Number(e.target.value))} className="w-full accent-accent" />
          </div>
          <button onClick={handleCreate} disabled={loading || !mediaId} className="btn-primary w-full">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-5 h-5 fill-current" />Create & Join</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NewWatchPartyPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center pt-16"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>}><NewRoomForm /></Suspense>
}
