// hooks/useAISuggestions.ts
import { useState, useCallback } from 'react'
import { aiApi } from '@/lib/api'

export const useAISuggestions = () => {
  const [suggesting, setSuggesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Smart Tag Suggestion
  const suggestTags = useCallback(async (content: string, sourceId?: string): Promise<string[]> => {
    try {
      setSuggesting(true)
      setError(null)
      
      const response = await aiApi.suggestTags(content, sourceId)
      
      if (response.success) {
        return parseTagString(response.data)
      } else {
        throw new Error(response.message || 'Failed to get tag suggestions')
      }
    } catch (err: any) {
      const errorMsg = err.message || 'AI service unavailable'
      setError(errorMsg)
      console.error('AI Tag Suggestion Error:', err)
      return []
    } finally {
      setSuggesting(false)
    }
  }, [])

  // Quality Score
  const rateQuestionQuality = useCallback(async (question: string, sourceId?: string) => {
    try {
      setSuggesting(true)
      setError(null)
      
      const response = await aiApi.qualityScore(question, sourceId)
      
      if (response.success) {
        try {
          // Try to parse as JSON first
          return JSON.parse(response.data)
        } catch {
          // Fallback: extract rating and suggestions from text
          const ratingMatch = response.data.match(/(\d+)\/10|Rating:\s*(\d+)/i)
          const rating = ratingMatch ? parseInt(ratingMatch[1] || ratingMatch[2]) : 5
          const suggestions = response.data.replace(/.*(Suggestions:|Tips:)/i, '').trim() || response.data
          return { rating, suggestions }
        }
      } else {
        throw new Error(response.message || 'Failed to get quality score')
      }
    } catch (err: any) {
      const errorMsg = err.message || 'AI service unavailable'
      setError(errorMsg)
      console.error('AI Quality Score Error:', err)
      return { rating: 5, suggestions: 'Unable to analyze quality at this time' }
    } finally {
      setSuggesting(false)
    }
  }, [])

  // Duplicate Detection  
  const detectDuplicates = useCallback(async (question: string, sourceId?: string): Promise<string> => {
    try {
      setSuggesting(true)
      setError(null)
      
      const response = await aiApi.detectDuplicates(question, sourceId)
      
      if (response.success) {
        return response.data
      } else {
        throw new Error(response.message || 'Failed to check for duplicates')
      }
    } catch (err: any) {
      const errorMsg = err.message || 'AI service unavailable'
      setError(errorMsg)
      console.error('AI Duplicate Detection Error:', err)
      return '' // Return empty string on error (no duplicates detected)
    } finally {
      setSuggesting(false)
    }
  }, [])

  // Title Rewriting
  const rewriteTitle = useCallback(async (title: string, sourceId?: string): Promise<string> => {
    try {
      setSuggesting(true)
      setError(null)
      
      const response = await aiApi.rewriteTitle(title, sourceId)
      
      if (response.success) {
        return response.data
      } else {
        throw new Error(response.message || 'Failed to rewrite title')
      }
    } catch (err: any) {
      const errorMsg = err.message || 'AI service unavailable'
      setError(errorMsg)
      console.error('AI Title Rewrite Error:', err)
      return title // Return original title on error
    } finally {
      setSuggesting(false)
    }
  }, [])

  // Helper function for tag parsing
  const parseTagString = (tagString: string): string[] => {
    return tagString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .slice(0, 8)
  }

  return {
    suggestTags,
    rewriteTitle,
    rateQuestionQuality,
    detectDuplicates,
    suggesting,
    error,
    clearError: () => setError(null)
  }
}