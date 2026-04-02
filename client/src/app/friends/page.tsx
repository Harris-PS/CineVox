'use client'

import { useEffect, useState } from 'react'
import { UserPlus, Clock, Users, Check, X, Loader2 } from 'lucide-react'
import { client } from '@/lib/axios'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/authStore'
import { cn, getInitials } from '@/lib/utils'

export default function FriendsPage() {
  const { isAuthenticated } = useAuthStore()
  const [activeTab, setActiveTab] = useState('friends')
  const [friends, setFriends] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [friendEmail, setFriendEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return
    Promise.all([
      client.get(api.friends.list),
      client.get(api.friends.pending),
    ]).then(([f, p]) => { setFriends(f.data); setPendingRequests(p.data) }).catch(console.error).finally(() => setLoading(false))
  }, [isAuthenticated])

  const handleAddFriend = async () => {
    if (!friendEmail.trim()) return
    setActionLoading('add')
    try {
      await client.post(api.friends.request, { email: friendEmail.trim() })
      setFriendEmail('')
    } catch (err: any) { alert(err.response?.data?.message || 'Failed') }
    finally { setActionLoading(null) }
  }

  const handleAccept = async (friendId: string) => {
    setActionLoading(`accept-${friendId}`)
    try {
      await client.post(api.friends.accept(friendId))
      setPendingRequests(prev => prev.filter(r => r.from.id !== friendId))
      const res = await client.get(api.friends.list)
      setFriends(res.data)
    } catch { } finally { setActionLoading(null) }
  }

  const handleReject = async (friendId: string) => {
    setActionLoading(`reject-${friendId}`)
    try {
      await client.delete(api.friends.reject(friendId))
      setPendingRequests(prev => prev.filter(r => r.from.id !== friendId))
    } catch { } finally { setActionLoading(null) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-16"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-3xl font-bold text-text">Friends & Activity</h1><p className="text-text-secondary mt-1">See what your friends are watching</p></div>
        </div>

        <div className="flex items-center gap-1 mb-8 border-b border-border/30">
          {[
            { id: 'friends', label: 'Friends', icon: Users },
            { id: 'pending', label: 'Pending', icon: Clock, count: pendingRequests.length },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text')}>
              <tab.icon className="w-4 h-4" />{tab.label}
              {tab.count && tab.count > 0 && <span className="px-1.5 py-0.5 bg-accent/20 text-accent text-xs rounded-full">{tab.count}</span>}
            </button>
          ))}
        </div>

        {activeTab === 'friends' && (
          <div className="space-y-6">
            <div className="glass-card p-4">
              <div className="flex gap-2">
                <input type="email" value={friendEmail} onChange={(e) => setFriendEmail(e.target.value)} className="flex-1 input-field" placeholder="Enter friend's email" />
                <button onClick={handleAddFriend} disabled={actionLoading === 'add' || !friendEmail.trim()} className="btn-primary">
                  {actionLoading === 'add' ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-5 h-5" />Add Friend</>}
                </button>
              </div>
            </div>
            {friends.length === 0 ? (
              <div className="text-center py-16"><Users className="w-12 h-12 text-text-muted mx-auto mb-4" /><h3 className="text-lg font-semibold text-text mb-2">No friends yet</h3><p className="text-text-secondary">Add friends to see what they're watching</p></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map((friend: any) => (
                  <div key={friend.id} className="glass-card p-4 card-hover">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-accent/20 border-2 border-accent/30 flex items-center justify-center text-sm font-semibold text-accent">{getInitials(friend.displayName)}</div>
                        <div className={cn('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-bg', friend.isOnline ? 'bg-neon-green' : 'bg-text-muted')} />
                      </div>
                      <div><h3 className="font-semibold text-text">{friend.displayName}</h3><p className="text-sm text-text-secondary">{friend.isOnline ? 'Online' : 'Offline'}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-16"><Clock className="w-12 h-12 text-text-muted mx-auto mb-4" /><h3 className="text-lg font-semibold text-text mb-2">No pending requests</h3></div>
            ) : (
              pendingRequests.map((req: any) => (
                <div key={req.id} className="glass-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 border-2 border-accent/30 flex items-center justify-center text-sm font-semibold text-accent">{getInitials(req.from.displayName)}</div>
                    <div><p className="font-semibold text-text">{req.from.displayName}</p><p className="text-sm text-text-muted">{req.from.email}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleAccept(req.from.id)} disabled={actionLoading === `accept-${req.from.id}`} className="p-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-colors">
                      {actionLoading === `accept-${req.from.id}` ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    </button>
                    <button onClick={() => handleReject(req.from.id)} disabled={actionLoading === `reject-${req.from.id}`} className="p-2 bg-bg-elevated text-text-secondary rounded-lg hover:bg-border transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
