'use client'

import { useState } from 'react'
import { searchApi } from '@/lib/api'

// In hooks/useSearch.ts - update interface
interface SearchResult {
  id: string
  type: 'question' | 'answer' | 'user' | 'tag'
  title?: string
  body?: string
  author_name?: string
  question_title?: string
  question_id?: string
  username?: string
  email?: string
  avatar_url?: string
  tag_name?: string
  question_count?: number
  created_at: string
  views_count?: number
  answers_count?: string
}

interface SearchResponse {
  success: boolean
  data: SearchResult[]
  counts: {
    questions: number
    answers: number
    users: number
    tags: number
  }
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [counts, setCounts] = useState({ questions: 0, answers: 0, users: 0, tags: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

 // In hooks/useSearch.ts - ensure you're handling the response structure
const search = async (query: string) => {
  if (!query.trim()) {
    setResults([])
    setCounts({ questions: 0, answers: 0, users: 0, tags: 0 })
    return
  }

  try {
    setLoading(true)
    setError(null)
    console.log('🔍 Searching for:', query)
    
    const response = await searchApi.search(query) as any
    // console.log('✅ Search response:', response)
    
    // ✅ FIXED: Handle both response formats
    if (response.success && response.data) {
      setResults(response.data)
      setCounts(response.counts || { questions: 0, answers: 0, users: 0, tags: 0 })
    } else if (Array.isArray(response)) {
      // Fallback for old format (just array of questions)
      setResults(response)
      setCounts({ 
        questions: response.filter(r => r.type === 'question').length,
        answers: response.filter(r => r.type === 'answer').length,
        users: response.filter(r => r.type === 'user').length,
        tags: response.filter(r => r.type === 'tag').length
      })
    } else {
      throw new Error('Invalid search response format')
    }
  } catch (err) {
    console.error('❌ Search error:', err)
    setError('Search temporarily unavailable')
    setResults([])
    setCounts({ questions: 0, answers: 0, users: 0, tags: 0 })
  } finally {
    setLoading(false)
  }
}

  const clearResults = () => {
    setResults([])
    setCounts({ questions: 0, answers: 0, users: 0, tags: 0 })
    setError(null)
  }

  return {
    results,
    counts,
    loading,
    error,
    search,
    clearResults
  }
}