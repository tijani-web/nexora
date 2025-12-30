'use client'

import { useState, useEffect } from 'react'
import { notificationsApi } from '@/lib/api'
import { Notification, NotificationsResponse } from '@/types/notification'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch notifications
  const fetchNotifications = async (params?: { limit?: number; offset?: number }) => {
    try {
      setLoading(true)
      setError(null)
      const response = await notificationsApi.getAll(params) as NotificationsResponse
      setNotifications(response.data)
      setUnreadCount(response.pagination.unreadCount)
    } catch (err) {
      setError('Failed to load notifications')
      console.error('Notification fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsApi.getUnreadCount() as any
      setUnreadCount(response.data.count)
    } catch (err) {
      console.error('Unread count fetch error:', err)
    }
  }

  // Mark as read
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId)
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Mark as read error:', err)
    }
  }// In hooks/useNotifications.ts - Add this useEffect
useEffect(() => {
  // Initial load
  refresh()
  
  // Auto-refresh unread count every 30 seconds
  const interval = setInterval(fetchUnreadCount, 30000)
  return () => clearInterval(interval)
}, [])

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Mark all as read error:', err)
    }
  }

  // Refresh both notifications and count
  const refresh = async () => {
    await Promise.all([fetchNotifications(), fetchUnreadCount()])
  }
  // Auto-refresh every 30 seconds
  useEffect(() => {
    refresh()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    refresh
  }
}