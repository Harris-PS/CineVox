'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Play, Users, Star, Loader2 } from 'lucide-react'
import { client } from '@/lib/axios'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/authStore'
import { cn, formatNumber } from '@/lib/utils'

interface MediaItem {
  _id: string; title: string; youtubeVideoId: string; thumbnail: string;
  year: number; genres: string[]; views: number; description: string;
}

interface Room {
  _id: string; name: string; currentViewerCount: number; maxViewers: number;
  hostId: { displayName: string };
  mediaId: { title: string; thumbnail: string };
}

function MediaCard({ media, size = 'md' }: { media: MediaItem; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-36', md: 'w-48', lg: 'w-56' }
  return (
    <Link href={`/media/${media._id}`} className={cn(sizes[size], 'flex-shrink-0 group relative rounded-lg overflow-hidden card-hover')}>
      <div className="aspect-video relative overflow-hidden">
        <img src={media.thumbnail} alt={media.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-60" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 bg-accent/90 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Play className="w-5 h-5 text-bg fill-current ml-0.5" />
          </div>
        </div>
      </div>
      <div className="p-2">
        <h3 className="text-sm font-semibold text-text truncate group-hover:text-accent transition-colors">{media.title}</h3>
        <p className="text-xs text-text-muted mt-0.5">{media.year} • {formatNumber(media.views || 0)} views</p>
      </div>
    </Link>
  )
}

function Carousel({ title, items, size = 'md' }: { title: string; items: MediaItem[]; size?: 'sm' | 'md' | 'lg' }) {
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null)
  return (
    <section>
      <h2 className="text-xl font-bold text-text mb-4 px-1">{title}</h2>
      <div ref={setScrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {items.map(m => <MediaCard key={m._id} media={m} size={size} />)}
      </div>
    </section>
  )
}

export default function HomePage() {
  const { isAuthenticated } = useAuthStore()
  const [trending, setTrending] = useState<MediaItem[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      client.get(api.media.trending).then(r => setTrending(r.data || [])).catch(() => {}),
      client.get(api.rooms.list).then(r => setRooms(r.data?.data || r.data || [])).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>

  const featured = trending[0]

  return (
    <div className="min-h-screen">
      {featured && (
        <section className="relative h-[70vh] min-h-[500px] flex items-end">
          <div className="absolute inset-0">
            <img src={featured.thumbnail} alt={featured.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
          </div>
          <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 w-full">
            <div className="max-w-2xl animate-slide-up">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="badge-accent">Featured</span>
                {featured.genres?.map((g: string) => <span key={g} className="badge">{g}</span>)}
              </div>
              <h1 className="text-5xl sm:text-6xl font-extrabold text-text leading-tight mb-4">{featured.title}</h1>
              <div className="flex items-center gap-4 text-text-secondary mb-6">
                <div className="flex items-center gap-1.5"><Star className="w-5 h-5 text-yellow-400 fill-current" /><span className="font-semibold text-text">{featured.views || 0} views</span></div>
                <span>{featured.year}</span>
              </div>
              <p className="text-text-secondary text-lg leading-relaxed mb-8 line-clamp-3">{featured.description}</p>
              <Link href={`/media/${featured._id}`} className="btn-primary"><Play className="w-5 h-5 fill-current" />Watch Now</Link>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 space-y-12 pb-16">
        <Carousel title="Trending Now" items={trending} size="md" />

        {isAuthenticated && rooms.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-text flex items-center gap-2 mb-6"><Users className="w-6 h-6 text-accent" />Live Watch Parties</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {rooms.map((room) => (
                <Link key={room._id} href={`/watch/${room._id}`} className="glass-card p-4 text-left card-hover group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="badge-live">LIVE</span>
                    <span className="text-xs text-text-secondary flex items-center gap-1"><Users className="w-3.5 h-3.5" />{room.currentViewerCount || 0}</span>
                  </div>
                  <h3 className="font-semibold text-text group-hover:text-accent transition-colors truncate">{room.name}</h3>
                  <p className="text-sm text-text-muted mt-1">Hosted by {room.hostId?.displayName || 'Unknown'}</p>
                  <div className="mt-3 h-1 bg-bg-elevated rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${((room.currentViewerCount || 0) / (room.maxViewers || 50)) * 100}%` }} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <Carousel title="All Videos" items={trending} size="sm" />
      </div>
    </div>
  )
}
