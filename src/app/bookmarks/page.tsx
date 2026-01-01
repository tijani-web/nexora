'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { bookmarksApi } from '@/lib/api'
import { Bookmark, BookmarkCheck, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import QuestionCard from '@/components/features/question-card'

interface BookmarkedQuestion {
  id: string
  question_id: string
  user_id: string
  created_at: string
  title: string
  body: string
  views_count: number
  answers_count: number
  bookmarks_count: number
  question_created_at: string
  author_name: string
  author_avatar: string
  tags: string[]
}

export default function BookmarksPage() {
  const { user } = useAuth()
  const [bookmarks, setBookmarks] = useState<BookmarkedQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  const fetchBookmarks = async (isLoadMore = false) => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const limit = 10
      const offset = isLoadMore ? (page - 1) * limit : 0

      const response = await bookmarksApi.getMyBookmarks({ limit, offset })
      
      if (isLoadMore) {
        setBookmarks(prev => [...prev, ...response.data])
      } else {
        setBookmarks(response.data)
      }

      setHasMore(response.pagination.hasMore)
      if (isLoadMore) {
        setPage(prev => prev + 1)
      } else {
        setPage(2)
      }
    } catch (err: any) {
      setError('Failed to load bookmarks')
      console.error('Error fetching bookmarks:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshBookmarks = () => {
    setPage(1)
    fetchBookmarks(false)
  }

  useEffect(() => {
    if (user) {
      fetchBookmarks(false)
    }
  }, [user])

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 text-center">
        <div className="bg-card border border-border rounded-lg p-6 sm:p-8">
          <Bookmark className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4 opacity-50" />
          <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Bookmarks</h1>
          <p className="text-muted-foreground mb-4 text-sm sm:text-base">Please log in to view your bookmarks</p>
          <Button 
            onClick={() => (window.location.href = '/login')}
            className="text-sm sm:text-base"
          >
            Log In
          </Button>
        </div>
      </div>
    )
  }

  if (loading && bookmarks.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="animate-pulse space-y-4 sm:space-y-6">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 sm:w-1/3"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 sm:h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
            <BookmarkCheck className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-yellow-500" />
            My Bookmarks
          </h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-sm">
            {bookmarks.length} saved question{bookmarks.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={refreshBookmarks}
            disabled={loading}
            className="text-xs sm:text-sm px-3 py-1.5 h-8 sm:h-9"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 sm:mb-6 text-xs sm:text-sm">
          {error}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshBookmarks}
            className="ml-2 sm:ml-4 mt-1 sm:mt-0 text-xs"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Bookmarks List */}
      <div className="space-y-4 sm:space-y-6">
        {bookmarks.length > 0 ? (
          <>
            {bookmarks.map((bookmark) => (
              <QuestionCard
                key={bookmark.id}
                question={{
                  id: bookmark.question_id,
                  title: bookmark.title,
                  body: bookmark.body,
                  author_id: bookmark.user_id, 
                  author_name: bookmark.author_name,
                  avatar_url: bookmark.author_avatar,
                  created_at: bookmark.question_created_at,
                  views_count: bookmark.views_count,
                  answers_count: bookmark.answers_count,
                  bookmarks_count: bookmark.bookmarks_count, 
                  votes_count: 0, 
                  updated_at: bookmark.question_created_at, 
                  tags: bookmark.tags,
                  image_url: null
                }}
                onQuestionUpdate={refreshBookmarks}
                showBookmark={true}
              />
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="text-center pt-2 sm:pt-4">
                <Button
                  onClick={() => fetchBookmarks(true)}
                  disabled={loading}
                  variant="outline"
                  className="text-sm sm:text-base"
                >
                  {loading ? 'Loading...' : 'Load More Bookmarks'}
                </Button>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <Card className="text-center py-8 sm:py-12">
            <CardContent>
              <Bookmark className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4 opacity-50" />
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-2">
                No bookmarks yet
              </h3>
              <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base max-w-md mx-auto px-4">
                Start saving questions you find interesting by clicking the bookmark icon.
              </p>
              <Button 
                onClick={() => (window.location.href = '/')}
                className="text-sm sm:text-base"
              >
                Browse Questions
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}