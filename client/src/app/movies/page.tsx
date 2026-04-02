'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Play, Star, Loader2 } from 'lucide-react'
import { client } from '@/lib/axios'
import { api } from '@/lib/api'
import { formatNumber } from '@/lib/utils'

interface MediaItem {
  _id: string; title: string; youtubeVideoId: string; thumbnail: string;
  year: number; genres: string[]; views: number; description: string;
}

function MediaCard({ media }: { media: MediaItem }) {
  return (
    <Link href={`/media/${media._id}`} className="group relative rounded-lg overflow-hidden card-hover">
      <div className="aspect-video relative overflow-hidden">
        <img src={media.thumbnail} alt={media.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-60" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 bg-accent/90 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Play className="w-6 h-6 text-bg fill-current ml-0.5" />
          </div>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-text group-hover:text-accent transition-colors">{media.title}</h3>
        <p className="text-xs text-text-muted mt-1">{media.year} • {formatNumber(media.views || 0)} views</p>
      </div>
    </Link>
  )
}

export default function MoviesPage() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get(api.media.list, { params: { limit: 50, sort: 'views' } })
      .then(r => setMedia(r.data?.data || r.data || [])).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-16"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8"><h1 className="text-3xl font-bold text-text">Movies</h1><p className="text-text-secondary mt-1">Discover amazing content</p></div>
        {media.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {media.map(m => <MediaCard key={m._id} media={m} />)}
          </div>
        ) : (
          <div className="text-center py-24"><p className="text-text-secondary">No content yet. Check back soon!</p></div>
        )}
      </div>
    </div>
  )
}
