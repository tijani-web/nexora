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
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="bg-card border border-border rounded-lg p-8">
          <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h1 className="text-2xl font-bold mb-4">Bookmarks</h1>
          <p className="text-muted-foreground mb-4">Please log in to view your bookmarks</p>
          <Button onClick={() => (window.location.href = '/login')}>
            Log In
          </Button>
        </div>
      </div>
    )
  }

  if (loading && bookmarks.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BookmarkCheck className="h-8 w-8 text-yellow-500" />
            My Bookmarks
          </h1>
          <p className="text-muted-foreground mt-2">
            {bookmarks.length} saved question{bookmarks.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={refreshBookmarks}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshBookmarks}
            className="ml-4"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Bookmarks List */}
      <div className="space-y-6">
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
              <div className="text-center">
                <Button
                  onClick={() => fetchBookmarks(true)}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? 'Loading...' : 'Load More Bookmarks'}
                </Button>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <Card className="text-center py-12">
            <CardContent>
              <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No bookmarks yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Start saving questions you find interesting by clicking the bookmark icon.
              </p>
              <Button onClick={() => (window.location.href = '/')}>
                Browse Questions
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}