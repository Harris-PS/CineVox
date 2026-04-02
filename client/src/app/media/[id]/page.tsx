'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Play, Users, Star, Loader2, Share2 } from 'lucide-react'
import { client } from '@/lib/axios'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/authStore'
import { formatNumber } from '@/lib/utils'

interface MediaItem {
  _id: string; title: string; youtubeVideoId: string; thumbnail: string;
  year: number; genres: string[]; tags: string[]; views: number; description: string;
}

export default function MediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [media, setMedia] = useState<MediaItem | null>(null)
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    client.get(api.media.detail(id)).then(r => setMedia(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>
  if (!media) return <div className="min-h-screen flex items-center justify-center"><p className="text-text-secondary">Not found</p></div>

  return (
    <div className="min-h-screen">
      <div className="relative h-[60vh] min-h-[400px]">
        <img src={media.thumbnail} alt={media.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 pb-12">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl animate-slide-up">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {media.genres?.map((g: string) => <span key={g} className="badge">{g}</span>)}
                {media.tags?.map((t: string) => <span key={t} className="badge">{t}</span>)}
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-text mb-4">{media.title}</h1>
              <div className="flex items-center gap-4 text-text-secondary flex-wrap mb-6">
                <div className="flex items-center gap-1.5"><Star className="w-5 h-5 text-yellow-400 fill-current" /><span className="font-semibold text-text">{formatNumber(media.views || 0)} views</span></div>
                <span>{media.year}</span>
              </div>
              <p className="text-text-secondary text-lg leading-relaxed mb-8 max-w-2xl">{media.description}</p>
              <div className="flex items-center gap-3 flex-wrap">
                {isAuthenticated ? (
                  <Link href={`/watch/new?mediaId=${media._id}`} className="btn-primary"><Play className="w-5 h-5 fill-current" />Start Watch Party</Link>
                ) : (
                  <Link href={`/login?redirect=/watch/new?mediaId=${media._id}`} className="btn-primary"><Play className="w-5 h-5 fill-current" />Sign In to Watch</Link>
                )}
                <button className="btn-secondary"><Share2 className="w-5 h-5" />Share</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
