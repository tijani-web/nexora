// app/dashboard/page.tsx
'use client'

import { useQuestions } from '@/hooks/useQuestions'
import QuestionCard from '@/components/features/question-card'
import { HeroSearch } from '@/components/features/hero-search'
import { Button } from '@/components/ui/button'
import { useState, useEffect, useRef, useCallback } from 'react'

export default function DashboardPage() {
  const { 
    questions, 
    loading, 
    error, 
    hasMore, 
    isLoadingMore, 
    loadMore, 
    refetch 
  } = useQuestions()
  
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const observer = useRef<IntersectionObserver | null>(null)

  const handleQuestionUpdate = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  useEffect(() => {
    if (refreshTrigger > 0) {
      refetch()
    }
  }, [refreshTrigger, refetch])

  const lastQuestionElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || isLoadingMore) return
    
    if (observer.current) observer.current.disconnect()
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore()
      }
    })
    
    if (node) observer.current.observe(node)
  }, [loading, isLoadingMore, hasMore, loadMore])

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Hero Search Section - Enhanced spacing */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="max-w-4xl mx-auto">
          <HeroSearch />
        </div>
      </div>
      
      {/* Questions Feed - Enhanced responsive padding */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-20 lg:pb-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-6 lg:mb-8">
            Recent Questions
          </h2>
          
          {loading && (
            <div className="space-y-4 lg:space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-4 lg:p-6 animate-pulse rounded-xl">
                  <div className="space-y-3 lg:space-y-4">
                    <div className="h-5 lg:h-6 bg-muted rounded w-3/4 lg:w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                    <div className="flex flex-wrap gap-2">
                      <div className="h-6 bg-muted rounded w-16"></div>
                      <div className="h-6 bg-muted rounded w-20"></div>
                    </div>
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 pt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-muted rounded-full"></div>
                        <div className="h-4 bg-muted rounded w-20"></div>
                      </div>
                      <div className="flex gap-4">
                        <div className="h-4 bg-muted rounded w-12"></div>
                        <div className="h-4 bg-muted rounded w-12"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="card p-6 text-center rounded-xl">
              <div className="text-destructive text-lg mb-3">Error loading questions</div>
              <div className="text-muted-foreground text-sm mb-4">
                {error}
              </div>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                size="sm"
              >
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-4 lg:space-y-6">
              {questions.map((question, index) => {
                if (questions.length === index + 1) {
                  return (
                    <div key={question.id} ref={lastQuestionElementRef}>
                      <QuestionCard 
                        question={question}
                        onQuestionUpdate={handleQuestionUpdate}
                      />
                    </div>
                  )
                } else {
                  return (
                    <QuestionCard 
                      key={question.id} 
                      question={question}
                      onQuestionUpdate={handleQuestionUpdate}
                    />
                  )
                }
              })}
              
              {isLoadingMore && (
                <div className="space-y-4 lg:space-y-6">
                  {[1, 2].map((i) => (
                    <div key={`loading-${i}`} className="card p-4 lg:p-6 animate-pulse rounded-xl">
                      <div className="space-y-3 lg:space-y-4">
                        <div className="h-5 lg:h-6 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-full"></div>
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 pt-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-muted rounded-full"></div>
                            <div className="h-4 bg-muted rounded w-20"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {questions.length === 0 && (
                <div className="card p-6 lg:p-8 text-center rounded-xl">
                  <div className="text-muted-foreground text-lg mb-3">
                    No questions yet
                  </div>
                  <div className="text-muted-foreground text-sm mb-6">
                    Be the first to ask a question!
                  </div>
                  <Button 
                    onClick={() => window.location.href = '/ask'}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                    size="lg"
                  >
                    Ask Question
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}