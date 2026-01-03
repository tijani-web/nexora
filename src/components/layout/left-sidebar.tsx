'use client'

import { 
  Home, 
  Bookmark, 
  TrendingUp,
  PlusCircle,
  LogOut,
  User,
  Info,
  X,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useAuth } from '@/contexts/AuthContext'
import { NotificationBell } from '@/components/features/NotificationBell'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useRouter } from 'next/navigation'

interface LeftSidebarProps {
  isOpen: boolean
  onClose: () => void
}

// Removed Search item
const navigationItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: TrendingUp, label: 'Trending', href: '/trending' },
  { icon: Bookmark, label: 'Bookmarks', href: '/bookmarks' },
  { icon: User, label: 'Profile', href: '/profile' },
  { icon: Info, label: 'About', href: '/about' },
]

export function LeftSidebar({ isOpen, onClose }: LeftSidebarProps) {
  const { user, logout } = useAuth()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const router = useRouter()

  const handleNavigation = (href: string) => {
    router.push(href)
    if (!isDesktop) {
      onClose() // Close on mobile/tablet after navigation
    }
  }

  return (
    <>
      {/* Overlay for mobile/tablet ONLY */}
      {isOpen && !isDesktop && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar with custom scrollbar */}
      <aside className={`
        fixed left-0 top-0 z-50 h-full w-64 bg-card border-r border-border
        transition-transform duration-300 flex flex-col shadow-xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:z-30 lg:shadow-none
      `}>
        
        {/* Header - Removed collapsible button on desktop */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Nexora Logo" className="h-10 w-10" />
          </div>
          
          <div className="flex items-center gap-2">
            {isDesktop ? (
              <>
                <NotificationBell />
                <ThemeToggle />
              </>
            ) : (
              // Mobile close button
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>


        {/* Ask Question Button */}
        <div className="p-4">
          <Button  
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => handleNavigation('/ask')}
          >
            <PlusCircle className="h-5 w-5" />
            Ask Question
          </Button>
        </div>

        {/* Navigation with custom scrollbar */}
        <nav className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-600">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.label}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-foreground hover:bg-accent"
                    onClick={() => handleNavigation(item.href)}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Button>
                </li>
              )
            })}
          
            {/* Nexa Chatbot */}
            <li className="pt-4 mt-4 border-t border-border">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-foreground hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/30 dark:hover:text-purple-400 border border-purple-200 dark:border-purple-800"
                onClick={() => handleNavigation('/chat')}
              >
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <div className="flex items-center gap-2">
                  <span>Nexa AI</span>
                  <span className="px-1.5 py-0.5 text-xs bg-purple-500 text-white rounded-full font-medium">
                    AI
                  </span>
                </div>
              </Button>
            </li>
          </ul>
        </nav>

        {/* User Section / Auth */}
        <div className="p-4 border-t border-border mt-auto">
          {user ? (
            <div className="space-y-3">
              {/* Only show on mobile/tablet, not on desktop */}
              {!isDesktop && (
                <Button
                  className="w-full bg-accent hover:bg-accent/80 text-foreground"
                  onClick={() => handleNavigation('/profile')}
                >
                  View Profile
                </Button>
              )}

               {user && (
          <div className="p-4 border-b border-border bg-accent/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border-2 border-primary/20">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username ?? 'User avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-lg font-medium">
                    {user?.username?.[0]?.toUpperCase() ?? 'U'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-foreground">{user.username}</p>
                {!isDesktop && (
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                )}
              </div>
            </div>
          </div>
        )}
              
              <Button
                className="w-full text-red-600 hover:bg-red-50"
                variant="ghost"
                onClick={() => {
                  logout()
                  if (!isDesktop) onClose()
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => handleNavigation('/login')}
              >
                Log In
              </Button>
              <Button
                variant="outline"
                onClick={() => handleNavigation('/register')}
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}