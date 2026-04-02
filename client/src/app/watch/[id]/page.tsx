'use client'

import { useEffect, useState, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, MessageSquare, Send, Loader2 } from 'lucide-react'
import { client } from '@/lib/axios'
import { api, WS_URL } from '@/lib/api'
import { useAuthStore } from '@/lib/authStore'
import YouTubePlayer from '@/components/YouTubePlayer'
import { cn, getInitials } from '@/lib/utils'
import { io, Socket } from 'socket.io-client'

export default function WatchPartyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user, isAuthenticated, token } = useAuthStore()
  const [room, setRoom] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(true)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [extPlay, setExtPlay] = useState(false)
  const [extPause, setExtPause] = useState(false)
  const [extSeek, setExtSeek] = useState<number | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return }
    client.get(api.rooms.detail(id)).then(r => {
      setRoom(r.data)
      setLoading(false)
    }).catch(() => router.push('/'))
  }, [id, isAuthenticated, router])

  useEffect(() => {
    if (!room || !token) return
    const socket = io(WS_URL, { auth: { token }, transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('room:join', { roomId: id })
      socket.emit('chat:history', { roomId: id })
    })
    socket.on('room:state', (state: any) => {
      if (state.currentTime) setExtSeek(state.currentTime)
    })
    socket.on('playback:play', (state: any) => {
      if (state.currentTime) setExtSeek(state.currentTime)
      setExtPlay(true)
      setTimeout(() => setExtPlay(false), 100)
    })
    socket.on('playback:pause', (state: any) => {
      if (state.currentTime) setExtSeek(state.currentTime)
      setExtPause(true)
      setTimeout(() => setExtPause(false), 100)
    })
    socket.on('playback:seek', (state: any) => {
      setExtSeek(state.currentTime)
    })
    socket.on('chat:message', (msg: any) => setMessages(prev => [...prev, msg]))
    socket.on('chat:history', (history: any[]) => setMessages(history))
    socket.on('room:user_joined', (data: any) => setRoom((prev: any) => prev ? { ...prev, currentViewerCount: data.viewerCount } : prev))
    socket.on('room:user_left', (data: any) => setRoom((prev: any) => prev ? { ...prev, currentViewerCount: data.viewerCount } : prev))

    return () => { socket.emit('room:leave', id); socket.disconnect(); socketRef.current = null }
  }, [room, token, id])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = () => {
    if (!message.trim() || !socketRef.current) return
    socketRef.current.emit('chat:message', { roomId: id, content: message.trim() })
    setMessage('')
  }

  const handlePlay = () => {
    if (socketRef.current && room?.hostId?._id === user?.id) socketRef.current.emit('playback:play', { roomId: id, currentTime: 0 })
  }
  const handlePause = () => {
    if (socketRef.current && room?.hostId?._id === user?.id) socketRef.current.emit('playback:pause', { roomId: id, currentTime: 0 })
  }
  const handleSeek = (time: number) => {
    if (socketRef.current && room?.hostId?._id === user?.id) socketRef.current.emit('playback:seek', { roomId: id, currentTime: time })
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>
  if (!room) return <div className="min-h-screen flex items-center justify-center"><p className="text-text-secondary">Room not found</p></div>

  const isHost = room.hostId?._id === user?.id
  const videoId = room.mediaId?.youtubeVideoId

  return (
    <div className="h-screen flex flex-col bg-bg">
      <div className="flex items-center justify-between px-4 py-3 glass border-b border-border/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 text-text-secondary hover:text-text rounded-lg hover:bg-bg-elevated transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h2 className="font-semibold text-text">{room.name || room.mediaId?.title}</h2>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="badge-live">LIVE</span>
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{room.currentViewerCount || 1} watching</span>
            </div>
          </div>
        </div>
        <button onClick={() => setChatOpen(!chatOpen)} className={cn('p-2 rounded-lg transition-colors', chatOpen ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text')}>
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-5xl relative">
              {videoId ? (
                <YouTubePlayer videoId={videoId} isHost={isHost} onPlay={handlePlay} onPause={handlePause} onSeek={handleSeek}
                  externalPlay={extPlay} externalPause={extPause} externalSeek={extSeek} />
              ) : (
                <div className="w-full aspect-video bg-black rounded-xl flex items-center justify-center">
                  <p className="text-text-secondary">Video not available</p>
                </div>
              )}
            </div>
          </div>
          <div className="px-4 pb-4">
            <div className="glass-card p-4 max-w-5xl mx-auto flex items-center justify-between">
              <span className="text-sm text-text-secondary">{isHost ? 'You control playback' : `Host controls playback`}</span>
              <span className="text-xs text-text-muted">Synced with {Math.max(0, (room.currentViewerCount || 1) - 1)} others</span>
            </div>
          </div>
        </div>

        {chatOpen && (
          <div className="w-80 border-l border-border/30 flex flex-col flex-shrink-0 animate-slide-in-right">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <div className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-accent" /><h3 className="font-semibold text-text text-sm">Live Chat</h3></div>
              <span className="badge">{messages.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? <div className="text-center py-8"><p className="text-text-muted text-sm">No messages yet</p></div> :
                messages.map((msg) => (
                  <div key={msg.id} className="animate-fade-in">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-[10px] font-semibold text-accent flex-shrink-0">{getInitials(msg.user?.displayName || 'U')}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><span className="text-sm font-medium text-text">{msg.user?.displayName || 'Unknown'}</span><span className="text-[10px] text-text-muted">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                        <p className="text-sm text-text-secondary mt-0.5 break-words">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t border-border/30">
              <div className="flex items-center gap-2">
                <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-bg-elevated border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors" />
                <button onClick={handleSend} disabled={!message.trim()} className={cn('p-2 rounded-lg transition-all', message.trim() ? 'text-accent hover:bg-accent/10' : 'text-text-muted cursor-not-allowed')}>
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
