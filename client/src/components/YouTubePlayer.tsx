'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack, Settings } from 'lucide-react'
import { cn, formatTime } from '@/lib/utils'

declare global {
  interface Window { YT: any; onYouTubeIframeAPIReady: () => void; }
}

interface YouTubePlayerProps {
  videoId: string
  isHost?: boolean
  onPlay?: (time: number) => void
  onPause?: (time: number) => void
  onSeek?: (time: number) => void
  onTimeUpdate?: (time: number) => void
  onReady?: () => void
  initialTime?: number
  externalPlay?: boolean
  externalPause?: boolean
  externalSeek?: number | null
}

let apiLoaded = false

export default function YouTubePlayer({ videoId, isHost, onPlay, onPause, onSeek, onTimeUpdate, onReady, initialTime = 0, externalPlay, externalPause, externalSeek }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(initialTime)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [playerReady, setPlayerReady] = useState(false)
  const timerRef = useRef<number | undefined>(undefined)
  const isExternalRef = useRef(false)

  const loadAPI = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (window.YT?.Player) { resolve(); return }
      if (apiLoaded) {
        const check = setInterval(() => { if (window.YT?.Player) { clearInterval(check); resolve() } }, 100)
        return
      }
      window.onYouTubeIframeAPIReady = () => { apiLoaded = true; resolve() }
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
      apiLoaded = true
    })
  }, [])

  useEffect(() => {
    let destroyed = false
    loadAPI().then(() => {
      if (destroyed || !containerRef.current) return
      if (playerRef.current) playerRef.current.destroy()

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          controls: 0, modestbranding: 1, rel: 0, showinfo: 0,
          iv_load_policy: 3, disablekb: 1, fs: 0, playsinline: 1,
          start: Math.floor(initialTime),
        },
        events: {
          onReady: (e: any) => {
            if (destroyed) return
            setPlayerReady(true)
            setDuration(e.target.getDuration())
            setCurrentTime(e.target.getCurrentTime())
            onReady?.()
            const interval = setInterval(() => {
              if (destroyed || !playerRef.current) { clearInterval(interval); return }
              const time = playerRef.current.getCurrentTime()
              setCurrentTime(time)
              onTimeUpdate?.(time)
            }, 1000)
          },
          onStateChange: (e: any) => {
            if (destroyed) return
            if (e.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true)
              if (!isExternalRef.current) onPlay?.(e.target.getCurrentTime())
              isExternalRef.current = false
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false)
              if (!isExternalRef.current) onPause?.(e.target.getCurrentTime())
              isExternalRef.current = false
            } else if (e.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false)
            }
          },
        },
      })
    })
    return () => { destroyed = true; if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null } }
  }, [videoId])

  useEffect(() => {
    if (externalPlay && playerReady && !isPlaying) {
      isExternalRef.current = true
      playerRef.current?.playVideo()
    }
  }, [externalPlay, playerReady, isPlaying])

  useEffect(() => {
    if (externalPause && playerReady && isPlaying) {
      isExternalRef.current = true
      playerRef.current?.pauseVideo()
    }
  }, [externalPause, playerReady, isPlaying])

  useEffect(() => {
    if (externalSeek !== null && playerReady) {
      isExternalRef.current = true
      playerRef.current?.seekTo(externalSeek, true)
      setCurrentTime(externalSeek ?? 0)
    }
  }, [externalSeek, playerReady])

  const togglePlay = () => {
    if (!playerRef.current || !playerReady) return
    if (isPlaying) { playerRef.current.pauseVideo(); }
    else { playerRef.current.playVideo(); }
  }

  const skip = (seconds: number) => {
    if (!playerRef.current || !playerReady) return
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
    playerRef.current.seekTo(newTime, true)
    setCurrentTime(newTime)
    if (isHost) onSeek?.(newTime)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !playerReady) return
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const time = percent * duration
    playerRef.current.seekTo(time, true)
    setCurrentTime(time)
    if (isHost) onSeek?.(time)
  }

  const toggleMute = () => {
    if (!playerRef.current) return
    if (isMuted) { playerRef.current.unMute(); playerRef.current.setVolume(volume) }
    else { playerRef.current.mute() }
    setIsMuted(!isMuted)
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value)
    setVolume(vol)
    if (playerRef.current) { playerRef.current.setVolume(vol); if (vol > 0) { playerRef.current.unMute(); setIsMuted(false) } }
  }

  const handleRate = (rate: number) => {
    setPlaybackRate(rate)
    if (playerRef.current) playerRef.current.setPlaybackRate(rate)
    setShowSettings(false)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group"
      onMouseMove={() => setShowControls(true)} onMouseLeave={() => isPlaying && setShowControls(false)}>
      <div ref={containerRef} className="w-full h-full" />
      <div className={cn('absolute bottom-0 left-0 right-0 transition-opacity duration-300', showControls ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
        <div onClick={handleSeek} className="relative h-1.5 mx-4 cursor-pointer group/progress hover:h-2.5 transition-all">
          <div className="absolute inset-0 bg-white/20 rounded-full" />
          <div className="absolute top-0 left-0 h-full bg-accent rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button onClick={togglePlay} className="p-2 text-text hover:text-accent transition-colors">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button onClick={() => skip(-10)} className="p-2 text-text hover:text-accent transition-colors"><SkipBack className="w-5 h-5" /></button>
            <button onClick={() => skip(10)} className="p-2 text-text hover:text-accent transition-colors"><SkipForward className="w-5 h-5" /></button>
            <div className="flex items-center gap-1 group/volume">
              <button onClick={toggleMute} className="p-2 text-text hover:text-accent transition-colors">
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input type="range" min="0" max="100" value={isMuted ? 0 : volume} onChange={handleVolume}
                className="w-0 group-hover/volume:w-20 transition-all duration-200 accent-accent" />
            </div>
            <span className="text-sm text-text-secondary ml-2">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-text hover:text-accent transition-colors"><Settings className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
      {showSettings && (
        <div className="absolute bottom-20 right-4 w-48 glass-card p-3 animate-slide-up">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Speed</span>
              <select value={playbackRate} onChange={(e) => handleRate(Number(e.target.value))}
                className="bg-bg-elevated border border-border rounded px-2 py-1 text-xs text-text focus:outline-none focus:border-accent">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => <option key={r} value={r}>{r}x</option>)}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
