// app/trending/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Flame, Calendar } from 'lucide-react'
import { questionsApi } from '@/lib/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface TrendingQuestion {
  id: string
  title: string
  body: string
  author_name: string
  avatar_url: string
  tags: string[]
  votes_count: number
  answers_count: number
  views_count: number
  created_at: string
  trending_score: number
}

const MarkdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '')
    const language = match ? match[1] : ''
    
    if (!inline && language) {
      return (
        <SyntaxHighlighter
          style={oneDark}
          language={language}
          PreTag="div"
          className="rounded-lg border border-border text-sm"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      )
    }

    return (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm border border-border" {...props}>
        {children}
      </code>
    )
  }
}

export default function TrendingPage() {
  const [questions, setQuestions] = useState<TrendingQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('week')

  useEffect(() => {
    fetchTrendingQuestions()
  }, [timeFilter])

  const fetchTrendingQuestions = async () => {
    try {
      setLoading(true)
      const response = await questionsApi.getTrending(timeFilter)
      setQuestions(response.data || [])
    } catch (error) {
      console.error('Failed to fetch trending questions:', error)
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  const getTrendingBadge = (index: number) => {
    if (index === 0) return { label: '🔥 Hot', color: 'bg-red-500 text-white' }
    if (index === 1) return { label: '🚀 Rising', color: 'bg-orange-500 text-white' }
    if (index === 2) return { label: '⭐ New', color: 'bg-blue-500 text-white' }
    return null
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInSeconds = Math.floor(diffInMs / 1000)
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Trending Questions</h1>
            <p className="text-muted-foreground">Most popular questions in the community</p>
          </div>
        </div>

        {/* Time Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' }
          ].map((filter) => (
            <Button
              key={filter.key}
              variant={timeFilter === filter.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeFilter(filter.key as any)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question, index) => {
          const trendingBadge = getTrendingBadge(index)
          
          return (
            <div key={question.id} className="card-hover p-6 border border-border rounded-lg bg-card transition-colors relative group">
              {/* Trending Badge */}
              {trendingBadge && (
                <div className={`absolute -top-2 -left-2 ${trendingBadge.color} px-3 py-1 rounded-full text-xs font-bold z-10`}>
                  {trendingBadge.label}
                </div>
              )}

              <div className="flex gap-4">
                {/* Stats Sidebar - Same as your question card */}
                <div className="flex-shrink-0 w-20 text-center space-y-2">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {question.votes_count}
                    </div>
                    <div className="text-xs text-muted-foreground">votes</div>
                  </div>
                  
                  <div className={`rounded-lg p-2 ${
                    question.answers_count > 0 
                      ? 'bg-green-50 dark:bg-green-900/20' 
                      : 'bg-gray-50 dark:bg-gray-900/20'
                  }`}>
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {question.answers_count}
                    </div>
                    <div className="text-xs text-muted-foreground">answers</div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-2">
                    <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                      {question.views_count}
                    </div>
                    <div className="text-xs text-muted-foreground">views</div>
                  </div>
                </div>

                {/* Question Content - Same as your question card */}
                <div className="flex-1 min-w-0">
                  <h3 
                    className="font-semibold text-lg text-foreground mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer break-words overflow-hidden line-clamp-2"
                    onClick={() => window.location.href = `/questions/${question.id}`}
                  >
                    {question.title}
                  </h3>
                  
                  {/* Markdown Body - Same syntax highlighting as your card */}
                  <div 
                    className="text-muted-foreground text-sm mb-3 line-clamp-2 cursor-pointer hover:text-foreground transition-colors prose prose-sm max-w-none dark:prose-invert"
                    onClick={() => window.location.href = `/questions/${question.id}`}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={MarkdownComponents}
                    >
                      {question.body}
                    </ReactMarkdown>
                  </div>

                  {/* Tags - Same blue background as your card */}
                  {question.tags && question.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {question.tags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 cursor-pointer text-xs"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Author and Date - Same styling as your card */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                        {question.author_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      
                      <span className="font-medium text-foreground max-w-[120px] truncate">
                        {question.author_name}
                      </span>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <Calendar className="h-3 w-3" />
                        <span>{formatTime(question.created_at)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0 text-sm">
                      <span className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full">
                        Score: {Math.round(question.trending_score)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {questions.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Flame className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No trending questions yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to ask a question and start trending!
            </p>
            <Button onClick={() => window.location.href = '/ask'}>
              Ask a Question
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}