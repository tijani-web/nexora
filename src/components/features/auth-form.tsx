'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Mail, Lock, User, Github, Chrome } from 'lucide-react'
import { authApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface AuthFormProps {
  mode: 'login' | 'register'
}


export function AuthForm({ mode }: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { login } = useAuth()
  const router = useRouter()

    useEffect(() => {
    console.log("User token:", localStorage.getItem("token"))
  }, [])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let response
      
      if (mode === 'register') {
        // Register API call
        response = await authApi.register(
          formData.username,
          formData.email,
          formData.password
        )
      } else {
        // Login API call
        response = await authApi.login(
          formData.email,
          formData.password
        )
      }

      // Save token and user data
      if (response.token && response.user) {
        await login(response.user, response.token)
        router.push('/') // Redirect to dashboard
      } else {
        throw new Error('Authentication failed')
      }
      
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = (provider: 'github' | 'google') => {
    if (provider === 'github') {
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/oauth/github`
    } else {
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/oauth/google`
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {mode === 'login' ? 'Welcome back' : 'Join Nexora'}
        </h1>
        <p className="text-muted-foreground">
          {mode === 'login' 
            ? 'Sign in to your account to continue' 
            : 'Create your account to start asking questions'
          }
        </p>
      </div>

      {/* OAuth Buttons */}
      <div className="space-y-3 mb-6">
        <Button
          variant="outline"
          className="w-full h-12"
          onClick={() => handleOAuth('github')}
          disabled={loading}
        >
          <Github className="h-5 w-5 mr-3" />
          Continue with GitHub
        </Button>
        
        <Button
          variant="outline"
          className="w-full h-12"
          onClick={() => handleOAuth('google')}
          disabled={loading}
        >
          <Chrome className="h-5 w-5 mr-3" />
          Continue with Google
        </Button>
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background text-muted-foreground">Or continue with email</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div className="space-y-2">
            <Label htmlFor="username" className="text-foreground">
              Username
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                className="pl-10"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required={mode === 'register'}
                disabled={loading}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="pl-10"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className="pl-10 pr-10"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              disabled={loading}
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {mode === 'login' ? 'Signing in...' : 'Creating account...'}
            </div>
          ) : (
            mode === 'login' ? 'Sign in' : 'Create account'
          )}
        </Button>
      </form>

      {/* Switch mode */}
      <div className="text-center mt-6">
        <p className="text-muted-foreground">
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <Button
  variant="link"
  className="p-0 h-auto text-blue-600 hover:text-blue-700"
  onClick={() => {
    const newPath = mode === 'login' ? '/register' : '/login'
    router.push(newPath) 
  }}
>
  {mode === 'login' ? 'Sign up' : 'Sign in'}
</Button>
        </p>
      </div>
    </div>
  )
}