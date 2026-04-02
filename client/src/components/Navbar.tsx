'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Play, Users, Home, Film, Heart, Menu, X, LogOut, User } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/lib/authStore'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Movies', icon: Film, path: '/movies' },
  { label: 'Anime', icon: Play, path: '/anime' },
  { label: 'Friends', icon: Users, path: '/friends' },
]

export default function Navbar() {
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isWatch = pathname?.startsWith('/watch')
  const isAuth = pathname === '/login' || pathname === '/register'
  if (isWatch || isAuth) return null

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center group-hover:shadow-lg group-hover:shadow-accent/30 transition-shadow">
              <Play className="w-4 h-4 text-bg fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight">Cine<span className="text-accent">Vox</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = (item.path === '/' && pathname === '/') || (item.path !== '/' && pathname?.startsWith(item.path))
              return (
                <Link key={item.path} href={item.path}
                  className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    isActive ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text hover:bg-bg-elevated')}>
                  <item.icon className="w-4 h-4" />{item.label}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link href="/mylist" className="hidden sm:flex p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-lg transition-colors">
                  <Heart className="w-5 h-5" />
                </Link>
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="w-8 h-8 bg-accent/20 border border-accent/30 rounded-full flex items-center justify-center text-xs font-semibold text-accent hover:bg-accent/30 transition-colors">
                    {user?.displayName?.[0]?.toUpperCase() || 'U'}
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-10 w-48 glass-card p-2 animate-slide-up">
                      <div className="px-3 py-2 border-b border-border/30 mb-2">
                        <p className="text-sm font-medium text-text truncate">{user?.displayName}</p>
                        <p className="text-xs text-text-muted truncate">{user?.email}</p>
                      </div>
                      {user?.role === 'admin' && (
                        <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text hover:bg-bg-elevated rounded-lg transition-colors">
                          <User className="w-4 h-4" /> Admin
                        </Link>
                      )}
                      <button onClick={() => { logout(); setUserMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link href="/login" className="btn-primary text-sm px-4 py-2">Sign In</Link>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-text-secondary hover:text-text rounded-lg">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-bg/90 backdrop-blur-xl" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-16 left-0 right-0 glass border-b border-border/30 p-4 animate-slide-up">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-text hover:bg-bg-elevated rounded-lg transition-colors">
                <item.icon className="w-5 h-5" />{item.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <Link href="/login" onClick={() => setMobileOpen(false)} className="block mt-2">
                <button className="btn-primary w-full">Sign In</button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
