'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, CheckCircle, MessageSquare, ThumbsUp, User, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNotifications } from '@/hooks/useNotification'
import { Notification } from '@/types/notification'
import Link from 'next/link'

// Get notification icon based on type
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'answer_posted':
      return <MessageSquare className="h-5 w-5 text-blue-400" />
    case 'answer_accepted':
      return <CheckCircle className="h-5 w-5 text-green-400" />
    case 'vote_received':
      return <ThumbsUp className="h-5 w-5 text-orange-400" />
    case 'mention':
      return <User className="h-5 w-5 text-purple-400" />
    case 'system_announcement':
      return <Megaphone className="h-5 w-5 text-yellow-400" />
    default:
      return <Bell className="h-5 w-5 text-gray-400" />
  }
}

// Get notification URL based on type and metadata
const getNotificationUrl = (notification: Notification) => {
  if (notification.reference_id) {
    switch (notification.type) {
      case 'answer_posted':
      case 'mention':
      case 'answer_accepted':
        return `/questions/${notification.reference_id}`
      case 'vote_received':
        return notification.metadata?.question_id ? `/questions/${notification.metadata.question_id}` : '/'
      default:
        return '/'
    }
  }
  return '/'
}

// Format time
const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / 60000)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

export default function NotificationsPage() {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead,
    refresh 
  } = useNotifications()

  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  // Auto-refresh notifications when page loads
  useEffect(() => {
    refresh()
  }, [])

  const filteredNotifications = notifications.filter(notif => 
    filter === 'all' ? true : !notif.is_read
  )

  const handleMarkAsRead = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
  }

  if (loading && notifications.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-destructive/20 bg-destructive/10">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={refresh}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-2">
            {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button 
            onClick={markAllAsRead} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Check className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg w-fit">
        <Button
          variant={filter === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
          className="rounded-md"
        >
          All
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('unread')}
          className="rounded-md"
        >
          Unread
        </Button>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">
            {filter === 'all' ? 'All Notifications' : 'Unread Notifications'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No {filter === 'unread' ? 'unread ' : ''}notifications
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {filter === 'unread' 
                  ? "You're all caught up! No unread notifications." 
                  : "When you receive notifications, they'll appear here."
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent/30 transition-colors ${
                    !notification.is_read ? 'bg-blue-500/10' : ''
                  }`}
                >
                  <Link
                    href={getNotificationUrl(notification)}
                    onClick={() => handleMarkAsRead(notification)}
                    className="flex items-start gap-4 group"
                  >
                    {/* Icon */}
                    <div className={`p-2 rounded-full flex-shrink-0 ${
                      !notification.is_read 
                        ? 'bg-blue-100 dark:bg-blue-900/30' 
                        : 'bg-muted'
                    } group-hover:scale-105 transition-transform`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`font-semibold ${
                          !notification.is_read 
                            ? 'text-foreground' 
                            : 'text-muted-foreground'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-2 flex-shrink-0"></div>
                        )}
                      </div>
                      
                      <p className={`mb-3 ${
                        !notification.is_read 
                          ? 'text-foreground' 
                          : 'text-muted-foreground'
                      }`}>
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {formatTime(notification.created_at)}
                        </span>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleMarkAsRead(notification)
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 hover:bg-accent"
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}