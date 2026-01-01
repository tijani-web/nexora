// components/layout/main-layout.tsx
'use client'

import { useState, useEffect } from 'react'
import { LeftSidebar } from './left-sidebar'
import { PopularTags } from '../features/porpular-tags'
import { useMediaQuery } from '@/hooks/use-media-query'
import { Bookmark, Compass, Home, MessageCircle, PlusCircle, TrendingUp, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const isMobile = useMediaQuery('(max-width: 640px)') // Changed: tablet starts at 768px
  const isTablet = useMediaQuery('(max-width: 1024px)')

  // Reset sidebars when screen size changes
  useEffect(() => {
    if (isMobile) {
      setLeftCollapsed(true)
      setRightCollapsed(true)
    } else if (isTablet) {
      // Tablet view: left sidebar visible, right sidebar hidden
      setLeftCollapsed(false)
      setRightCollapsed(true)
    } else {
      // Desktop - reset to default state
      setLeftCollapsed(false)
      setRightCollapsed(false)
    }
  }, [isMobile, isTablet])

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Sidebar - Hidden only on mobile (640px and below), visible on tablet */}
      {!isMobile && ( // Changed: only hide on mobile, not tablet
        <div className={`
          fixed left-0 top-0 z-30 h-full transition-all duration-200
          ${leftCollapsed ? 'w-16' : 'w-64'}
        `}>
          <LeftSidebar 
            collapsed={leftCollapsed}
            onToggle={() => setLeftCollapsed(!leftCollapsed)}
          />
        </div>
      )}
      
      {/* Main Content - PROPER FIXED SPACING */}
      <div className={`
        flex-1 flex flex-col min-w-0 w-full transition-all duration-200
        ${!isMobile && (leftCollapsed ? 'lg:ml-16' : 'lg:ml-64')}
        ${!isTablet && !rightCollapsed ? 'lg:mr-80' : ''}
        ${isMobile ? 'pb-20' : ''} // Add padding for mobile bottom nav
      `}>
        <div className="flex-1 w-full">
          {children}
        </div>
      </div>
      
      {/* Right Sidebar - Hidden on tablet/mobile */}
      {!isTablet && (
        <div className={`
          fixed right-0 top-0 h-full bg-card border-l border-border z-20
          transition-all duration-200
          ${rightCollapsed ? 'w-0 opacity-0' : 'w-80 opacity-100'}
        `}>
          <div className="p-6 h-full overflow-y-auto">
            <PopularTags />
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation - Only show on mobile (640px and below) */}
      {(isMobile) && <MobileBottomNav />}
    </div>
  )
}

// Mobile Bottom Navigation Component
function MobileBottomNav() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('home')
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 lg:hidden">
      <div className="flex justify-around items-center p-3">
        {/* Home */}
        <button
          onClick={() => { setActiveTab('home'); window.location.href = '/' }}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            activeTab === 'home' ? 'text-blue-600 bg-blue-50' : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">Home</span>
        </button>

        {/* Trending */}
        <button
          onClick={() => { setActiveTab('trending'); window.location.href = '/trending' }}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            activeTab === 'trending' ? 'text-blue-600 bg-blue-50' : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          <TrendingUp className="h-5 w-5" />
          <span className="text-xs">Trending</span>
        </button>

        {/* Ask Question - Prominent */}
        <button
          onClick={() => window.location.href = '/ask'}
          className="flex flex-col items-center gap-1 p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors -mt-6 shadow-lg"
        >
          <PlusCircle className="h-6 w-6" />
        </button>

        {/* AI Chat */}
        <button
          onClick={() => { setActiveTab('ai'); window.location.href = '/chat' }}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            activeTab === 'ai' ? 'text-purple-600 bg-purple-50' : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-xs">AI</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => { setActiveTab('profile'); window.location.href = user ? '/profile' : '/login' }}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            activeTab === 'profile' ? 'text-blue-600 bg-blue-50' : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-xs">Profile</span>
        </button>
      </div>
    </div>
  )
}