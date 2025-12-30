'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api' 

interface User {
  id: string
  username: string
  email: string
  avatar_url?: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  login: (user: User, token: string) => void
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true) // Start with true
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    } 
    
    setLoading(false) 
  }, [])

  // Login function - synchronous
  const login = (userData: User, token: string) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  // Manual registration
  const register = async (username: string, email: string, password: string) => {
    try {
      const data = await authApi.register(username, email, password)

      // Transform backend user to frontend user format
      const frontendUser: User = {
        id: data.user.id,
        username: data.user.name, 
        email: data.user.email,
        avatar_url: data.user.avatar_url || undefined,
        created_at: data.user.created_at
      }

      login(frontendUser, data.token)
      router.push('/') // redirect after registration
    } catch (error: any) {
      console.error('Registration failed:', error)
      throw new Error(error.message || 'Registration failed')
    }
  }

  // Logout
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
