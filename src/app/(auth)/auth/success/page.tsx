'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface BackendUser {
  id: string
  name: string
  email: string
  password_hash: string | null
  role: string
  created_at: string
  github_id: string | null
  google_id: string | null
  avatar_url: string | null
}

interface FrontendUser {
  id: string
  username: string
  email: string
  avatar_url?: string
  created_at: string
}

export default function AuthSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [handled, setHandled] = useState(false) // ✅ prevent loop

  useEffect(() => {
    if (handled) return // Already processed
    const token = searchParams.get('token')
    const user = searchParams.get('user')

    if (!token || !user) {
      console.warn('Missing token or user data')
      router.replace('/login?error=missing_token')
      setHandled(true)
      return
    }

    try {
      const backendUser: BackendUser = JSON.parse(decodeURIComponent(user))

      const frontendUser: FrontendUser = {
        id: backendUser.id,
        username: backendUser.name,
        email: backendUser.email,
        avatar_url: backendUser.avatar_url || undefined,
       created_at: backendUser.created_at
      }

      login(frontendUser, token)
      setHandled(true) // mark as done before redirect
      router.replace('/')
    } catch (error) {
      console.error('AuthSuccess parsing error:', error)
      setHandled(true)
      router.replace('/login?error=auth_failed')
    }
  }, [searchParams, login, router, handled])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-foreground">Completing login...</h2>
        <p className="text-muted-foreground mt-2">Please wait while we log you in.</p>
      </div>
    </div>
  )
}
