'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Play, Loader2, Eye, EyeOff } from 'lucide-react'
import { client } from '@/lib/axios'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/authStore'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await client.post(api.auth.login, { email, password })
      login(res.data.user, res.data.token)
      router.push(searchParams.get('redirect') || '/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-16 px-4">
      <div className="w-full max-w-md glass-card p-8 animate-slide-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-6">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center"><Play className="w-5 h-5 text-bg fill-current" /></div>
            <span className="text-2xl font-bold tracking-tight">Cine<span className="text-accent">Vox</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-text">Welcome back</h1>
          <p className="text-text-secondary mt-1">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pr-10" placeholder="••••••••" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"><EyeOff className="w-4 h-4" /></button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}</button>
        </form>
        <p className="text-center text-sm text-text-secondary mt-6">Don&apos;t have an account? <Link href="/register" className="text-accent hover:underline">Sign up</Link></p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center pt-16"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>}><LoginForm /></Suspense>
}
