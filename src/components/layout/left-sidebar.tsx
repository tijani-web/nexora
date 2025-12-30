// components/layout/left-sidebar.tsx
'use client'

import { 
  Home, 
  Bookmark, 
  TrendingUp,
  Menu,
  PlusCircle,
  LogOut,
  MessageCircle,
  User,
  Info,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useAuth } from '@/contexts/AuthContext'
import { NotificationBell } from '@/components/features/NotificationBell'
import { useMediaQuery } from '@/hooks/use-media-query'

interface LeftSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const navigationItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: TrendingUp, label: 'Trending', href: '/trending' },
  { icon: Bookmark, label: 'Bookmarks', href: '/bookmarks' },
]

export function LeftSidebar({ collapsed, onToggle }: LeftSidebarProps) {
  const { user, logout } = useAuth()
  const isTablet = useMediaQuery('(max-width: 1024px)')
  const isMobile = useMediaQuery('(max-width: 640px)')

  // On tablet, automatically collapse to small version
  const shouldCollapse = collapsed || isTablet

  // Don't show the sidebar at all on mobile (handled by MainLayout)
  if (isMobile) return null

  return (
    <aside className={`
      fixed left-0 top-0 z-30 h-full bg-card border-r border-border 
      transition-all duration-200 flex flex-col
      ${shouldCollapse ? 'w-16' : 'w-64'}
    `}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!shouldCollapse && (
          <h1 className="text-xl font-bold text-foreground">Nexora</h1>
        )}
        <div className="flex items-center gap-2">
          {isTablet ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8"
            >
              {shouldCollapse ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
          ) : (
            <>
              <NotificationBell />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="h-8 w-8"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Ask Question Button */}
      <div className="p-4">
        <Button  
          className={`
            w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white
            ${shouldCollapse && "px-2"}
          `}
          onClick={() => (window.location.href = '/ask')}
        >
          <PlusCircle className="h-4 w-4" />
          {!shouldCollapse && "Ask Question"}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.label}>
                <Button
                  variant="ghost"
                  className={`
                    w-full justify-start gap-3 text-foreground hover:bg-accent
                    ${shouldCollapse && "justify-center px-2"}
                  `}
                  onClick={() => window.location.href = item.href}
                  title={shouldCollapse ? item.label : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {!shouldCollapse && item.label}
                </Button>
              </li>
            )
          })}
          
          {/* Profile Link for logged in users */}
          {user && (
            <li>
              <Button
                variant="ghost"
                className={`
                  w-full justify-start gap-3 text-foreground hover:bg-accent
                  ${shouldCollapse && "justify-center px-2"}
                `}
                onClick={() => window.location.href = '/profile'}
                title={shouldCollapse ? "My Profile" : undefined}
              >
                <User className="h-4 w-4" />
                {!shouldCollapse && "My Profile"}
              </Button>
            </li>
          )}

          {/* About Page */}
          <li>
            <Button
              variant="ghost"
              className={`
                w-full justify-start gap-3 text-foreground hover:bg-accent
                ${shouldCollapse && "justify-center px-2"}
              `}
              onClick={() => window.location.href = '/about'}
              title={shouldCollapse ? "About" : undefined}
            >
              <Info className="h-4 w-4" />
              {!shouldCollapse && "About"}
            </Button>
          </li>
          
          {/* Nexa Chatbot - Separated with border */}
          <li className="pt-4 mt-4 border-t border-border/50">
            <Button
              variant="ghost"
              className={`
                w-full justify-start gap-3 text-foreground hover:bg-accent
                bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20
                border border-purple-500/20 hover:border-purple-500/30
                ${shouldCollapse && "justify-center px-2"}
              `}
              onClick={() => window.location.href = '/chat'}
              title={shouldCollapse ? "Nexa AI" : undefined}
            >
              <MessageCircle className="h-4 w-4 text-purple-600" />
              {!shouldCollapse && (
                <div className="flex items-center gap-2">
                  <span>Nexa</span>
                  <span className="px-1.5 py-0.5 text-xs bg-purple-500 text-white rounded-full font-medium">
                    AI
                  </span>
                </div>
              )}
            </Button>
          </li>
        </ul>
      </nav>

      {/* User Section / Auth */}
      <div className="p-4 border-t border-border mt-auto">
        {user ? (
          <div className={`flex items-center gap-3 ${shouldCollapse && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-sm font-medium">
                  {user.username[0].toUpperCase()}
                </span>
              )}
            </div>
            {!shouldCollapse && (
              <div className="flex-1 min-w-0 flex flex-col">
                <p className="text-sm font-medium truncate text-foreground">
                  {user.username}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 text-red-500 hover:bg-red-50"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4 mr-1" /> Logout
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className={`flex flex-col gap-2 ${shouldCollapse && 'items-center'}`}>
            {shouldCollapse ? (
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white p-2"
                onClick={() => (window.location.href = '/login')}
                title="Log In"
              >
                <User className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => (window.location.href = '/login')}
                >
                  Log In
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = '/register')}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}