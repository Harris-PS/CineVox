'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2, Upload, X } from 'lucide-react'
import { client } from '@/lib/axios'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/authStore'
import { cn, extractYouTubeId } from '@/lib/utils'

export default function AdminPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [media, setMedia] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '', description: '', youtubeUrl: '', genres: '', tags: '', year: 2025, isPublished: true,
  })

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') { router.push('/'); return }
    fetchMedia()
  }, [isAuthenticated, user, router])

  const fetchMedia = async () => {
    try {
      const res = await client.get(api.media.admin)
      setMedia(res.data)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const resetForm = () => {
    setFormData({ title: '', description: '', youtubeUrl: '', genres: '', tags: '', year: 2025, isPublished: true })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      const payload = {
        ...formData,
        youtubeVideoId: extractYouTubeId(formData.youtubeUrl) || undefined,
        genres: formData.genres.split(',').map(g => g.trim()).filter(Boolean),
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      }
      if (editingId) await client.put(api.media.detail(editingId), payload)
      else await client.post(api.media.list, payload)
      resetForm()
      fetchMedia()
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to save') }
    finally { setFormLoading(false) }
  }

  const handleEdit = (item: any) => {
    setFormData({
      title: item.title, description: item.description, youtubeUrl: `https://youtube.com/watch?v=${item.youtubeVideoId}`,
      genres: item.genres?.join(', ') || '', tags: item.tags?.join(', ') || '',
      year: item.year, isPublished: item.isPublished,
    })
    setEditingId(item._id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media?')) return
    try { await client.delete(api.media.detail(id)); fetchMedia() } catch { alert('Failed to delete') }
  }

  const handleToggleStatus = async (id: string, current: boolean) => {
    try { await client.put(api.media.detail(id), { isPublished: !current }); fetchMedia() } catch { alert('Failed') }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-16"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-3xl font-bold text-text">Admin Dashboard</h1><p className="text-text-secondary mt-1">Manage your content library</p></div>
          <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary"><Plus className="w-5 h-5" />Add Media</button>
        </div>

        {showForm && (
          <div className="glass-card p-6 mb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text">{editingId ? 'Edit Media' : 'Add New Media'}</h2>
              <button onClick={resetForm} className="p-2 text-text-secondary hover:text-text rounded-lg hover:bg-bg-elevated"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-text-secondary mb-1">Title *</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input-field" required /></div>
                <div><label className="block text-sm font-medium text-text-secondary mb-1">YouTube URL *</label>
                  <input type="text" value={formData.youtubeUrl} onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })} className="input-field" placeholder="https://youtube.com/watch?v=..." required /></div>
              </div>
              <div><label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" rows={3} /></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-text-secondary mb-1">Genres (comma-separated)</label>
                  <input type="text" value={formData.genres} onChange={(e) => setFormData({ ...formData, genres: e.target.value })} className="input-field" placeholder="Sci-Fi, Action" /></div>
                <div><label className="block text-sm font-medium text-text-secondary mb-1">Tags (comma-separated)</label>
                  <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="input-field" placeholder="Dystopian, AI" /></div>
                <div><label className="block text-sm font-medium text-text-secondary mb-1">Year</label>
                  <input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })} className="input-field" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={formLoading} className="btn-primary">{formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5" />{editingId ? 'Update' : 'Create'}</>}</button>
                <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-border/30">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Media</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Views</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {media.map((item: any) => (
                <tr key={item._id} className="hover:bg-bg-elevated/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-9 rounded overflow-hidden flex-shrink-0 bg-bg-elevated">
                        {item.thumbnail && <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />}
                      </div>
                      <div><p className="font-medium text-text">{item.title}</p><p className="text-xs text-text-muted">{item.year}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      item.isPublished ? 'bg-neon-green/20 text-neon-green' : 'bg-text-muted/20 text-text-muted')}>
                      {item.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{item.views || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleToggleStatus(item._id, item.isPublished)} className="p-1.5 text-text-secondary hover:text-accent rounded-lg hover:bg-bg-elevated transition-colors">
                        {item.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-text-secondary hover:text-accent rounded-lg hover:bg-bg-elevated transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item._id)} className="p-1.5 text-text-secondary hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {media.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-lg font-semibold text-text mb-2">No media yet</h3>
              <p className="text-text-secondary mb-4">Add your first YouTube video</p>
              <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary"><Plus className="w-5 h-5" />Add Media</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
