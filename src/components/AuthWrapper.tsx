'use client'

import { useAuth } from '@/contexts/AuthContext'
import Loading from '@/app/loading'

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  return <>{children}</>
}