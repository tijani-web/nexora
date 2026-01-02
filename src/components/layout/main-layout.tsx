'use client'

import { useState, useEffect } from 'react'
import { LeftSidebar } from './left-sidebar'
import { PopularTags } from '../features/porpular-tags'
import { useMediaQuery } from '@/hooks/use-media-query'
import { 
  Bookmark, 
  Home, 
  PlusCircle, 
  TrendingUp, 
  User, 
  Search,
  Menu,
  X,
  Info,
  Compass,
  MessageCircle
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { NotificationBell } from '@/components/features/NotificationBell'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const pathname = usePathname()
  const router = useRouter()

  // AUTO-RESET sidebar state when screen size changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false) // Mobile: closed
      setRightSidebarCollapsed(true) // Hide right sidebar
    } else if (isDesktop) {
      setSidebarOpen(true) // Desktop: open
      setRightSidebarCollapsed(false) // Show right sidebar
    } else {
      // Tablet
      setSidebarOpen(false) // Tablet: closed by default
      setRightSidebarCollapsed(true) // Hide right sidebar
    }
  }, [isMobile, isDesktop])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const navigate = (href: string) => {
    router.push(href)
  }

  return (
    <div className="flex min-h-screen bg-background relative">
      {/* Left Sidebar */}
      <LeftSidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Menu */}
      {isMobile && (
        <div className={`
          fixed left-0 top-0 h-full w-72 bg-card z-50 transform transition-transform duration-300 lg:hidden
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          shadow-xl
        `}>
          <MobileSidebarMenu 
            onClose={() => setMobileMenuOpen(false)} 
            navigate={navigate}
          />
        </div>
      )}
      
      {/* Main Content - FIXED: Only apply ml-64 on desktop when sidebar is open */}
      <div className={`
        flex-1 flex flex-col min-w-0 w-full transition-all duration-200
        ${isDesktop && sidebarOpen ? 'ml-64' : 'ml-0'}
        ${isDesktop && !rightSidebarCollapsed ? 'mr-80' : ''}
        ${isMobile ? 'pb-20' : ''}
      `}>
        {/* Mobile Top Header */}
        {isMobile && (
          <div className="sticky top-0 z-30 bg-card border-b border-border p-4 lg:hidden">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-accent"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <img src="/logo.png" alt="Nexora Logo" className="h-8 w-8" />
              
              <div className="flex items-center gap-2">
                <NotificationBell />
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}

        {/* Tablet/Destop Header (when sidebar is closed) */}
        {!isMobile && !sidebarOpen && (
          <div className="sticky top-0 z-30 bg-card/95 backdrop-blur-sm border-b border-border">
            <div className="flex items-center justify-between p-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <img src="/logo.png" alt="Nexora Logo" className="h-8 w-8" />
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/search')}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <Search className="h-5 w-5" />
                </button>
                <NotificationBell />
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}
        
        <div className="flex-1 w-full">
          {children}
        </div>
      </div>
      
      {/* Right Sidebar - Desktop only when sidebar is open */}
      {isDesktop && sidebarOpen && !rightSidebarCollapsed && (
        <div className="fixed right-0 top-0 h-full w-80 bg-card border-l border-border z-20">
          <div className="p-6 h-full overflow-y-auto">
            <PopularTags />
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav navigate={navigate} />}
    </div>
  )
}

// Mobile Bottom Navigation - FIXED with your exact style
function MobileBottomNav({ navigate }: { navigate: (href: string) => void }) {
  const { user } = useAuth()
  const pathname = usePathname()
  
  const navItems = [
    { id: 'home', label: 'Home', icon: Home, href: '/' },
    { id: 'trending', label: 'Trending', icon: TrendingUp, href: '/trending' },
    { id: 'ask', label: 'Ask', icon: PlusCircle, href: '/ask', isSpecial: true },
    { id: 'bookmarks', label: 'Saved', icon: Bookmark, href: '/bookmarks' },
    { id: 'profile', label: user ? 'Profile' : 'Login', icon: User, href: user ? '/profile' : '/login' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/98 backdrop-blur-md border-t border-border z-40 safe-area-pb shadow-lg">
      <div className="relative flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname?.startsWith(item.href))
          
          // Special FAB button in the center
          if (item.isSpecial) {
            return (
              <div key={item.id} className="relative flex items-center justify-center" style={{ flex: 1 }}>
                <button
                  onClick={() => navigate(item.href)}
                  className="absolute -top-6 p-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl hover:shadow-2xl active:scale-95 transition-all duration-200 hover:from-blue-700 hover:to-purple-700"
                  aria-label="Ask Question"
                >
                  <PlusCircle className="h-6 w-6" strokeWidth={2.5} />
                </button>
              </div>
            )
          }
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.href)}
              className={`
                relative flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 min-w-[60px]
                ${isActive 
                  ? 'text-blue-600' 
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
              style={{ flex: 1 }}
            >
              <div className="relative">
                <item.icon 
                  className={`h-5 w-5 transition-all ${isActive ? 'scale-110' : ''}`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                )}
              </div>
              <span className={`text-[10px] font-medium transition-all ${
                isActive ? 'opacity-100' : 'opacity-70'
              }`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// Mobile Sidebar Menu Component
function MobileSidebarMenu({ 
  onClose, 
  navigate 
}: { 
  onClose: () => void 
  navigate: (href: string) => void 
}) {
  const { user, logout } = useAuth()
  
  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: TrendingUp, label: 'Trending', href: '/trending' },
    { icon: Bookmark, label: 'Bookmarks', href: '/bookmarks' },
    { icon: MessageCircle, label: 'Nexa AI', href: '/chat' },
    { icon: Compass, label: 'Explore', href: '/explore' },
    { icon: Info, label: 'About', href: '/about' },
  ]

  const handleNavigation = (href: string) => {
    navigate(href)
    onClose()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Nexora Logo" className="h-10 w-10" />
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-accent"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden">
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
            <div className="flex-1">
              <p className="font-medium">{user.username}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.label}>
                <button
                  onClick={() => handleNavigation(item.href)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent text-left"
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Actions */}
      <div className="p-4 border-t border-border space-y-3">
        {user ? (
          <>
            <button
              onClick={() => handleNavigation('/profile')}
              className="w-full p-3 rounded-lg bg-accent hover:bg-accent/80"
            >
              View Full Profile
            </button>
            <button
              onClick={() => {
                logout()
                onClose()
              }}
              className="w-full p-3 rounded-lg text-red-600 hover:bg-red-50"
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleNavigation('/login')}
              className="w-full p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Log In
            </button>
            <button
              onClick={() => handleNavigation('/register')}
              className="w-full p-3 rounded-lg border border-border hover:bg-accent"
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </div>
  )
}