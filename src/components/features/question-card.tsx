'use client'

import { MessageCircle, Eye, Edit, Trash2, Hash, User, Bookmark, BookmarkCheck, Sparkles, Bot, Zap, Brain, MoreHorizontal } from 'lucide-react'
import { Question } from '@/hooks/useQuestions'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { questionsApi, bookmarksApi, aiApi } from '@/lib/api'
import { useState, useEffect, useRef } from 'react'
import { DeleteConfirmation } from '../ui/delete-confirmation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface QuestionCardProps {
  question: Question
  onQuestionUpdate?: () => void
  showBookmark?: boolean 
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

const Avatar = ({ name, avatarUrl }: { name?: string | null; avatarUrl?: string | null }) => {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'User'}
        className="w-6 h-6 rounded-full object-cover border border-border"
      />
    )
  }
  
  return (
    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
      <User className="h-3 w-3" />
    </div>
  )
}

export default function QuestionCard({ question, onQuestionUpdate, showBookmark = true }: QuestionCardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // AI Features State
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [contentType, setContentType] = useState<string | null>(null)
  const [similarQuestions, setSimilarQuestions] = useState<string[]>([])
  const [loadingAI, setLoadingAI] = useState(false)
  const [showAIFeatures, setShowAIFeatures] = useState(false)

  const questionAuthorId = question.author_id
  const isOwner = user?.id === questionAuthorId
  const authorName = question.author_name || 'Unknown User'

  // Check if question is bookmarked on component mount
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (user && showBookmark) {
        try {
          const response = await bookmarksApi.check(question.id)
          setIsBookmarked(response.data.isBookmarked)
        } catch (error) {
          console.error('Failed to check bookmark status:', error)
        }
      }
    }

    checkBookmarkStatus()
  }, [user, question.id, showBookmark])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // TIME FORMATTING
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

  // AI: Generate summary on demand
  const generateAISummary = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (aiSummary) {
      setShowAIFeatures(!showAIFeatures)
      return
    }

    try {
      setLoadingAI(true)
      const response = await aiApi.quickSummary(question.body, question.id)
      
      if (response.success) {
        setAiSummary(response.data)
        setShowAIFeatures(true)
        
        // Also get content type
        const typeResponse = await aiApi.detectContentType(question.title + ' ' + question.body, question.id)
        if (typeResponse.success) {
          setContentType(typeResponse.data)
        }
        
        // Get similar questions
        const similarResponse = await aiApi.detectDuplicates(question.title, question.id)
        if (similarResponse.success && similarResponse.data) {
          // Parse similar questions from the response
          const similar = similarResponse.data.split('\n').filter((q: string) => q.trim().length > 0)
          setSimilarQuestions(similar.slice(0, 3))
        }
      }
    } catch (error) {
      console.error('AI summary generation failed:', error)
    } finally {
      setLoadingAI(false)
    }
  }

  const handleTitleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      await questionsApi.incrementViews(question.id)
    } catch (error) {
      console.error('Failed to increment views:', error)
    }
    
    router.push(`/questions/${question.id}`)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDropdown(false)
    router.push(`/questions/${question.id}/edit`)
  }

const handleDelete = async () => {
  try {
    setLoading(true)
    await questionsApi.delete(question.id)
    setIsDeleted(true)
    setShowDeleteConfirm(false)
    
    
  } catch (error) {
    console.error('Failed to delete question:', error)
    alert('Failed to delete question')
    setLoading(false)
  }
}

  // Bookmark toggle function
const handleBookmark = async (e: React.MouseEvent) => {
  e.stopPropagation()
  
  if (!user) {
    router.push('/login')
    return
  }

  try {
    setBookmarkLoading(true)
    
    if (isBookmarked) {
      await bookmarksApi.remove(question.id)
      setIsBookmarked(false)
    } else {
      await bookmarksApi.add(question.id)
      setIsBookmarked(true)
    }
    
    if (onQuestionUpdate) {
    }
  } catch (error) {
    console.error('Failed to toggle bookmark:', error)
  } finally {
    setBookmarkLoading(false)
  }
}

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDropdown(!showDropdown)
  }

  if (isDeleted) {
    return null
  }

  return (
    <>
      <div className="card-hover p-4 sm:p-6 border border-border rounded-lg bg-card transition-colors relative group">
        {/* AI Summary Toggle Button */}
        <button
          onClick={generateAISummary}
          className={`absolute -top-2 -left-2 sm:-top-3 sm:-left-3 p-1.5 sm:p-2 rounded-full border transition-all z-10 ${
            showAIFeatures 
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white border-purple-500 shadow-lg scale-110' 
              : 'bg-card border-border text-muted-foreground hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
          }`}
          title={aiSummary ? 'Toggle AI Insights' : 'Generate AI Summary'}
          disabled={loadingAI}
        >
          {loadingAI ? (
            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-current border-t-transparent"></div>
          ) : showAIFeatures ? (
            <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
          ) : (
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
        </button>

        {/* Action buttons - Bookmark + Dropdown */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex gap-1 sm:gap-2">
          {/* Bookmark Button - Always visible */}
          {showBookmark && (
            <button
              onClick={handleBookmark}
              className={`p-1.5 sm:p-2 transition-colors rounded-md ${
                isBookmarked 
                  ? 'text-yellow-500 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30' 
                  : 'text-muted-foreground hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
              }`}
              title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              disabled={bookmarkLoading}
            >
              {bookmarkLoading ? (
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-current"></div>
              ) : isBookmarked ? (
                <BookmarkCheck className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
              ) : (
                <Bookmark className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </button>
          )}

          {/* Dropdown for Edit/Delete - Only for owner */}
          {isOwner && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                title="More options"
              >
                <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-popover border border-border rounded-md shadow-lg z-20 animate-in fade-in-50">
                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors rounded-t-md"
                    disabled={loading}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true)
                      setShowDropdown(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-b-md"
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Features Panel */}
        {showAIFeatures && (
          <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-200 dark:border-purple-500/20 rounded-lg animate-in fade-in-50">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
              <span className="text-xs sm:text-sm font-semibold text-purple-600 dark:text-purple-400">AI Insights</span>
            </div>
            
            {/* AI Summary */}
            {aiSummary && (
              <div className="mb-2 sm:mb-3">
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">{aiSummary}</p>
              </div>
            )}
            
            {/* Content Type Badge */}
            {contentType && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground">Category:</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full capitalize">
                  {contentType.toLowerCase()}
                </span>
              </div>
            )}
            
            {/* Similar Questions */}
            {similarQuestions.length > 0 && (
              <div className="mt-2 sm:mt-3">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                  <Brain className="h-3 w-3 text-blue-500" />
                  <span className="text-xs font-medium text-muted-foreground">Related Topics:</span>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  {similarQuestions.map((question, index) => (
                    <p key={index} className="text-xs text-muted-foreground leading-relaxed">
                      • {question}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h3 
  className="font-semibold text-base sm:text-lg text-foreground mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer break-words overflow-hidden line-clamp-2 max-w-[calc(100%-60px)] sm:max-w-none pr-10 sm:pr-0"
  onClick={handleTitleClick}
  title={question.title}
>
  {question.title}
</h3>
            
            {/* Markdown Body */}
            <div 
              className="text-muted-foreground text-xs sm:text-sm mb-3 line-clamp-2 cursor-pointer hover:text-foreground transition-colors prose prose-sm max-w-none dark:prose-invert"
              onClick={handleTitleClick}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={MarkdownComponents}
              >
                {question.body}
              </ReactMarkdown>
            </div>

            {question.image_url && (
              <div className="mb-3">
                <img 
                  src={question.image_url} 
                  alt="Question image" 
                  className="max-w-full h-48 sm:h-56 md:h-64 lg:h-72 object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={handleTitleClick}
                />
              </div>
            )}
            
            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
                {question.tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="flex items-center gap-1 bg-gray-900 text-blue-400 hover:bg-blue-950/40 hover:text-blue-300 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs transition-colors duration-150 cursor-pointer border border-gray-800"
                  >
                    <Hash className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <Avatar name={authorName} avatarUrl={question.avatar_url} />
                
                <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
                  {questionAuthorId ? (
                    <Link 
                      href={`/profile/${questionAuthorId}`}
                      className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors max-w-[80px] sm:max-w-[120px] truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {authorName}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground max-w-[80px] sm:max-w-[120px] truncate">
                      {authorName}
                    </span>
                  )}
                  
                  {isOwner && (
                    <span className="text-xs bg-blue-600 text-white dark:bg-blue-900 dark:text-blue-200 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shrink-0">
                      You
                    </span>
                  )}
                  
                  <span className="shrink-0 whitespace-nowrap text-xs sm:text-sm">{formatTime(question.created_at)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">{question.answers_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">{question.views_count}</span>
                </div>
                {question.bookmarks_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Bookmark className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">{question.bookmarks_count}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <DeleteConfirmation
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          loading={loading}
          title="Delete Question"
          message="Are you sure you want to delete this question? This action cannot be undone."
        />
      )}
    </>
  )
}