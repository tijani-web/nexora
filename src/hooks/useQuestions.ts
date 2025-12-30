import { useState, useEffect } from 'react'
import { questionsApi } from '@/lib/api'


export interface Question {
  id: string
  title: string
  body: string
  author_id: string  
  created_at: string
  updated_at: string
  views_count: number
  answers_count: number
  bookmarks_count: number
  votes_count: number
  author_name: string
  avatar_url?: string | null
  tags?: string[]
  image_url?: string | null
}

interface PaginatedResponse {
  questions: Question[]
  pagination: {
    page: number
    limit: number 
    hasMore: boolean
  }
}

export const useQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Initial load or refresh
  const fetchQuestions = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setIsLoadingMore(true)
      } else {
        setLoading(true)
      }
      
      setError(null)
      
      // Use the new paginated endpoint
      const response = await questionsApi.getPaginated(page, 10) // 10 questions per page
      
      if (isLoadMore) {
        // Add new questions to existing ones
        setQuestions(prev => [...prev, ...response.questions])
      } else {
        // Replace questions for initial load
        setQuestions(response.questions)
      }
      
      setHasMore(response.pagination.hasMore)
      setPage(prev => prev + 1)
      
    } catch (err: any) {
      setError(err.message || 'Failed to fetch questions')
    } finally {
      setLoading(false)
      setIsLoadingMore(false)
    }
  }

  // Load more questions
  const loadMore = () => {
    if (hasMore && !isLoadingMore) {
      fetchQuestions(true)
    }
  }

  // Refresh all questions
  const refetch = () => {
    setPage(1)
    setHasMore(true)
    fetchQuestions(false)
  }

  // Initial load
  useEffect(() => {
    fetchQuestions(false)
  }, [])

  return {
    questions,
    loading,
    error,
    hasMore,
    isLoadingMore,
    loadMore,
    refetch,
    fetchQuestions
  }
}