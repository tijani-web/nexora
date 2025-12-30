// components/features/popular-tags.tsx
'use client'

import { useState, useEffect } from 'react'
import { questionsApi } from '@/lib/api'
import { Hash, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useMediaQuery } from '@/hooks/use-media-query'

interface Tag {
  id: string
  name: string
  question_count: number
}

export function PopularTags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const isMobile = useMediaQuery('(max-width: 768px)')

  useEffect(() => {
    fetchTagsFromQuestions()
  }, [])

  // Auto-expand on mobile
  useEffect(() => {
    if (isMobile) {
      setExpanded(true)
    }
  }, [isMobile])

  const fetchTagsFromQuestions = async () => {
    try {
      const questions = await questionsApi.getAll()
      
      // Calculate tag counts from questions
      const tagCounts: { [key: string]: number } = {}
      questions.forEach((question: any) => {
        if (question.tags && Array.isArray(question.tags)) {
          question.tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          })
        }
      })
      
      // Transform to Tag array
      const calculatedTags: Tag[] = Object.entries(tagCounts)
        .map(([name, question_count], index) => ({
          id: `tag-${index}`,
          name,
          question_count
        }))
        .sort((a, b) => b.question_count - a.question_count)
      
      setAllTags(calculatedTags)
      // Show all tags on mobile, limited on desktop
      setTags(isMobile ? calculatedTags : calculatedTags.slice(0, 5))
    } catch (error) {
      console.error('Failed to fetch tags from questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = () => {
    if (expanded) {
      setTags(allTags.slice(0, 5))
    } else {
      setTags(allTags)
    }
    setExpanded(!expanded)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Popular Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex justify-between items-center animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-8"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" />
          Popular Tags
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tags.map((tag) => (
            <div 
              key={tag.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors group cursor-pointer"
              onClick={() => window.location.href = `/tags/${tag.name}`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Hash className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-sm group-hover:text-blue-600 transition-colors truncate">
                  {tag.name}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs flex-shrink-0 ml-2">
                {tag.question_count}
              </Badge>
            </div>
          ))}
        </div>
        
        {/* Enhanced Expand/Collapse Button - Only show on desktop when needed */}
        {allTags.length > 5 && !isMobile && (
          <button
            onClick={toggleExpand}
            className="w-full mt-3 flex items-center justify-center gap-2 p-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-border"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show All ({allTags.length - 5} more)
              </>
            )}
          </button>
        )}
        
        {tags.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No tags found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}