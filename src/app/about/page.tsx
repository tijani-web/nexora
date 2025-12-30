// app/about/page.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  BookOpen, 
  MessageSquare, 
  Code, 
  Heart,
  Globe,
  Shield,
  TrendingUp,
  Mail,
  Github,
  Linkedin
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { statsApi } from '@/lib/api'

interface PlatformStats {
  questions: number
  answers: number
  users: number
  tags: number
}

export default function AboutPage() {
  const [stats, setStats] = useState<PlatformStats>({ questions: 0, answers: 0, users: 0, tags: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlatformStats = async () => {
      try {
        const statsData = await statsApi.getStats()
        setStats(statsData)
      } catch (error) {
        console.error('Failed to fetch platform stats:', error)
        setStats({ questions: 0, answers: 0, users: 0, tags: 0 })
      } finally {
        setLoading(false)
      }
    }

    fetchPlatformStats()
  }, [])

  const features = [
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Q&A Community",
      description: "Ask questions and get answers from developers worldwide"
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Knowledge Sharing",
      description: "Share your expertise and learn from others"
    },
    {
      icon: <Code className="h-6 w-6" />,
      title: "Code Focused",
      description: "Dedicated to programming and technical discussions"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Quality Content",
      description: "Moderated community with high-quality answers"
    }
  ]

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <Badge variant="secondary" className="mb-6 text-sm">
          About Nexora
        </Badge>
        <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome to Nexora
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
          A modern Q&A platform where developers share knowledge, 
          ask questions, and grow together in the ever-evolving world of technology.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            onClick={() => window.location.href = '/ask'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          >
            Ask a Question
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="px-8 py-3"
          >
            Explore Community
          </Button>
        </div>
      </div>

      {/* Live Stats - REAL COUNTS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { key: 'questions' as keyof PlatformStats, label: 'Questions', icon: <MessageSquare className="h-5 w-5" />, color: 'bg-blue-500' },
          { key: 'answers' as keyof PlatformStats, label: 'Answers', icon: <BookOpen className="h-5 w-5" />, color: 'bg-green-500' },
          { key: 'users' as keyof PlatformStats, label: 'Users', icon: <Users className="h-5 w-5" />, color: 'bg-purple-500' },
          { key: 'tags' as keyof PlatformStats, label: 'Tags', icon: <TagIcon className="h-5 w-5" />, color: 'bg-orange-500' }
        ].map((stat) => (
          <Card key={stat.key} className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative">
            {/* Floating Live Badge */}
            <div className="absolute -top-2 -right-2">
              <Badge variant="default" className="bg-green-500 text-white text-xs animate-pulse">
                Live
              </Badge>
            </div>
            
            <CardContent className="p-6">
              <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <div className="text-white">
                  {stat.icon}
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">
                {loading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mx-auto"></div>
                ) : (
                  <span>{stats[stat.key]}</span>
                )}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {stat.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-foreground text-center mb-12">
          Why Choose Nexora?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 rounded-lg flex items-center justify-center mx-auto mb-4 transition-colors">
                  <div className="text-blue-600 dark:text-blue-400">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="grid lg:grid-cols-2 gap-8 mb-16">
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              To create a welcoming space where developers of all levels can learn, 
              share knowledge, and collaborate. We believe in the power of community 
              and open knowledge sharing to advance technology and help developers grow 
              in their careers.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              Our Vision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              To become the go-to platform for developers seeking reliable answers 
              and meaningful discussions. We envision a world where no developer 
              struggles alone, and knowledge flows freely across the global tech community.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Developer Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-0 mb-16">
        <CardContent className="p-8 lg:p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
            Built with ❤️ by Tijani Basit
          </h3>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
            Nexora is developed and maintained by Tijani Basit, a passionate full-stack developer 
            dedicated to creating tools that bring developers together and make knowledge sharing 
            accessible to everyone in the tech community.
          </p>
          
          {/* Social Links */}
          <div className="flex justify-center gap-4 mb-6 flex-wrap">
            <a 
              href="mailto:basiittdev@gmail.com?subject=Hello from Nexora&body=Hi Basit,"
              className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900 transition-colors"
            >
              <Mail className="h-5 w-5" />
              <span>Email</span>
            </a>
            
            <a 
              href="https://github.com/tijani-web"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 transition-colors"
            >
              <Github className="h-5 w-5" />
              <span>GitHub</span>
            </a>
            
            <a 
              href="https://www.linkedin.com/in/basit-tijani/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900 transition-colors"
            >
              <Linkedin className="h-5 w-5" />
              <span>LinkedIn</span>
            </a>
          </div>

          <div className="flex justify-center gap-3 flex-wrap">
            <Badge variant="secondary" className="text-sm py-1.5 px-3">
              Full-Stack Developer
            </Badge>
            <Badge variant="secondary" className="text-sm py-1.5 px-3">
              Community Focused
            </Badge>
            <Badge variant="secondary" className="text-sm py-1.5 px-3">
              Open Source
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Community Guidelines */}
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            Community Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
              <Heart className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground mb-2">Be Respectful</h4>
                <p className="text-sm text-muted-foreground">
                  Treat all community members with respect and kindness. We're here to help each other grow.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
              <Shield className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground mb-2">Quality Content</h4>
                <p className="text-sm text-muted-foreground">
                  Provide helpful, detailed answers and ask clear questions. Quality over quantity always.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
              <BookOpen className="h-6 w-6 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground mb-2">Share Knowledge</h4>
                <p className="text-sm text-muted-foreground">
                  Help others learn by sharing your expertise and experiences. Everyone starts somewhere.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Simple Tag icon component
function TagIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" 
      />
    </svg>
  )
}