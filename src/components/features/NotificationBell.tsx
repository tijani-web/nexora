'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/hooks/useNotification'
import { useEffect } from 'react'
import Link from 'next/link'

export function NotificationBell() {
  const { unreadCount, fetchUnreadCount } = useNotifications()

  // Auto-refresh unread count every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  return (
    <Link href="/notifications">
      <Button
        variant="ghost"
        size="icon"
        className="relative hover:bg-accent/50 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {/* RED BADGE WITH COUNT */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium border-2 border-card">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
    </Link>
  )
}