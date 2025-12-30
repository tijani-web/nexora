// components/trending-questions.tsx
'use client'

import { useState, useEffect } from 'react'
import { questionsApi } from '@/lib/api'
import { TrendingUp, Eye, MessageSquare, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface TrendingQuestion {
  id: string
  title: string
  views_count: number
  answers_count: number
  votes_count: number
  created_at: string
  tags: string[]
}

export function TrendingQuestions() {
  const [questions, setQuestions] = useState<TrendingQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTrendingQuestions()
  }, [])

  const fetchTrendingQuestions = async () => {
    try {
      setError(null)
      console.log('🔄 Fetching trending questions...')
      
      // Use your actual questions API
      const allQuestions = await questionsApi.getAll()
      console.log('✅ RAW Questions API response:', allQuestions)
      
      if (!allQuestions || !Array.isArray(allQuestions)) {
        throw new Error('Invalid questions response - not an array')
      }

      if (allQuestions.length === 0) {
        console.log('📭 No questions found in response')
        setQuestions([])
        setLoading(false)
        return
      }
      
  
      
      // Transform and filter valid questions
      const validQuestions: TrendingQuestion[] = allQuestions
        .map((question: any) => {
          // Check if question has required properties
          if (!question.id || !question.title) {
            console.warn('❌ Invalid question skipped:', question)
            return null
          }
          
          return {
            id: question.id,
            title: question.title,
            views_count: question.views_count || question.views || 0,
            answers_count: question.answers_count || 0,
            votes_count: question.votes_count || question.votes || 0,
            created_at: question.created_at || new Date().toISOString(),
            tags: question.tags || question.tag_list || []
          }
        })
        .filter((question): question is TrendingQuestion => question !== null)
        .sort((a: TrendingQuestion, b: TrendingQuestion) => b.views_count - a.views_count)
        .slice(0, 5)
      
      console.log('📊 Final trending questions:', validQuestions)
      setQuestions(validQuestions)
      
    } catch (error) {
      console.error('❌ Failed to fetch trending questions:', error)
      setError('Failed to load trending questions')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // If we have no questions and no error, show empty state
  if (questions.length === 0 && !error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No trending questions yet</p>
            <p className="text-xs mt-1">Questions will appear here as they get more views</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trending Questions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded mb-4">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          {questions.map((question) => (
            <Link 
              key={question.id}
              href={`/questions/${question.id}`}
              className="block p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/50 transition-all group"
            >
              <h3 className="font-medium text-sm leading-tight mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                {question.title}
              </h3>
              
              {/* Tags */}
              {question.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {question.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={`${tag}-${index}`} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {question.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{question.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{question.views_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{question.answers_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>{question.votes_count}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}