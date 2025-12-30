
'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { questionsApi, answersApi, votesApi, aiApi } from '@/lib/api'
import { Question } from '@/hooks/useQuestions'
import { ArrowUp, ArrowDown, MessageCircle, Check, Edit, Trash2, X, Sparkles, Bot, Zap, Brain, Crown, Gem, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'


interface Answer {
  id: string
  body: string
  user_id: string
  question_id: string
  created_at: string
  updated_at: string
  is_accepted: boolean
  author_name: string
  votes_count: number
  upvotes: number
  downvotes: number
  user_vote: 'upvote' | 'downvote' | null
  avatar_url?: string | null
}


// AI Summary Interface
interface AISummary {
  id: string
  question_id: string
  summary: string
  model_info: string
  created_at: string
}


// Avatar Component
const Avatar = ({ name, image }: { name: string; image?: string | null }) => {
  const [imgError, setImgError] = useState(false)

  if (image && !imgError) {
    return (
      <img
        src={image}
        alt={name}
        className="w-8 h-8 rounded-full object-cover border border-border"
        onError={() => setImgError(true)}
      />
    )
  }

  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
      {initials}
    </div>
  )
}

// Delete Confirmation Modal
const DeleteConfirmation = ({ 
  answerId, 
  onConfirm, 
  onCancel 
}: { 
  answerId: string; 
  onConfirm: (id: string) => void; 
  onCancel: () => void; 
}) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Delete Answer</h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>
      <p className="text-muted-foreground mb-6">
        Are you sure you want to delete this answer? This action cannot be undone.
      </p>
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={() => onConfirm(answerId)}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Delete Answer
        </Button>
      </div>
    </div>
  </div>
)

export default function QuestionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { user } = useAuth()
  const [question, setQuestion] = useState<Question | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)


  // AI Features State
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [contentType, setContentType] = useState<string | null>(null)
  const [similarQuestions, setSimilarQuestions] = useState<string[]>([])
  const [showAIFeatures, setShowAIFeatures] = useState(false)

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }
  

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


    // Markdown Components for rich rendering
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
            className="rounded-lg border border-border"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        )
      }

      return (
        <code className="bg-muted px-2 py-1 rounded text-sm border border-border" {...props}>
          {children}
        </code>
      )
    },
    p: ({ children }: any) => <p className="mb-4 leading-relaxed text-foreground">{children}</p>,
    h1: ({ children }: any) => <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-xl font-bold mt-5 mb-3 text-foreground">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-lg font-bold mt-4 mb-2 text-foreground">{children}</h3>,
    ul: ({ children }: any) => <ul className="list-disc list-inside mb-4 space-y-1 text-foreground">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside mb-4 space-y-1 text-foreground">{children}</ol>,
    li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-border pl-4 py-2 my-4 text-muted-foreground italic">
        {children}
      </blockquote>
    ),
    a: ({ href, children }: any) => (
      <a href={href} className="text-blue-600 hover:text-blue-700 underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    strong: ({ children }: any) => <strong className="font-bold text-foreground">{children}</strong>,
    em: ({ children }: any) => <em className="italic text-foreground">{children}</em>,
  }


   useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [questionData, answersData] = await Promise.all([
          questionsApi.getById(id),
          answersApi.getByQuestion(id)
        ])
        
        // Fetch votes for each answer (keep your existing logic)
        const answersWithVotes = await Promise.all(
          answersData.map(async (answer: any) => {
            try {
              const voteData = await votesApi.getVotes(answer.id)
              return {
                ...answer,
                votes_count: parseInt(answer.votes_count) || 0,
                upvotes: parseInt(voteData.counts?.upvotes) || 0,
                downvotes: parseInt(voteData.counts?.downvotes) || 0,
                user_vote: voteData.userVote || null,
                avatar_url: answer.avatar_url || null
              }
            } catch (error) {
              return {
                ...answer,
                votes_count: parseInt(answer.votes_count) || 0,
                upvotes: 0,
                downvotes: 0,
                user_vote: null,
                avatar_url: answer.avatar_url || null
              }
            }
          })
        )

        // Sort answers (keep your existing logic)
        const sortedAnswers = [...answersWithVotes].sort((a, b) => {
          if (a.is_accepted && !b.is_accepted) return -1
          if (!a.is_accepted && b.is_accepted) return 1
          
          if (user) {
            const aIsUserAnswer = a.user_id === user.id
            const bIsUserAnswer = b.user_id === user.id
            if (aIsUserAnswer && !bIsUserAnswer) return -1
            if (!aIsUserAnswer && bIsUserAnswer) return 1
          }
          
          if (a.votes_count !== b.votes_count) return b.votes_count - a.votes_count
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        
        setQuestion(questionData)
        setAnswers(sortedAnswers)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }
    
    if (id) fetchData()
  }, [id, user])


  const handleSubmitAnswer = async () => {
    if (!user) {
      setSubmitError('Please log in to post an answer')
      return
    }

    if (!answerText.trim()) {
      setSubmitError('Answer cannot be empty')
      return
    }

    try {
      setSubmitting(true)
      setSubmitError(null)

      const newAnswer = await answersApi.create(id, answerText)

      // ✅ FIXED: Set updated_at same as created_at for new answers
      const optimisticAnswer: Answer = {
        id: newAnswer.id,
        body: answerText,
        user_id: user.id,
        question_id: id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(), // Same as created_at
        is_accepted: false,
        author_name: user.username || 'User',
        votes_count: 0,
        upvotes: 0,
        downvotes: 0,
        user_vote: null,
        avatar_url: user.avatar_url || null
      }

      // Add new answer and re-sort
      setAnswers(prev => {
        const newAnswers = [...prev, optimisticAnswer]
        return newAnswers.sort((a, b) => {
          if (a.is_accepted && !b.is_accepted) return -1
          if (!a.is_accepted && b.is_accepted) return 1
          
          if (user) {
            const aIsUserAnswer = a.user_id === user.id
            const bIsUserAnswer = b.user_id === user.id
            if (aIsUserAnswer && !bIsUserAnswer) return -1
            if (!aIsUserAnswer && bIsUserAnswer) return 1
          }
          
          if (a.votes_count !== b.votes_count) return b.votes_count - a.votes_count
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      })
      
      setAnswerText('')
      showToast('Answer posted successfully!', 'success')

      // Update question answer count
      setQuestion(prev => {
        if (!prev) return prev
        const currentCount = Number(prev.answers_count) || 0
        return {
          ...prev,
          answers_count: currentCount + 1
        }
      })

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to post answer'
      setSubmitError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = async (answerId: string, voteType: 'upvote' | 'downvote') => {
    if (!user) {
      setSubmitError('Please log in to vote')
      return
    }

    try {
      const answer = answers.find(a => a.id === answerId)
      if (!answer) return

      const currentVote = answer.user_vote
      
      // Optimistic update
      setAnswers(prev => prev.map(a => {
        if (a.id !== answerId) return a

        let newUpvotes = a.upvotes
        let newDownvotes = a.downvotes
        let newUserVote: 'upvote' | 'downvote' | null = voteType

        if (currentVote === voteType) {
          // Remove vote
          newUserVote = null
          if (voteType === 'upvote') newUpvotes -= 1
          if (voteType === 'downvote') newDownvotes -= 1
        } else if (currentVote && currentVote !== voteType) {
          // Change vote
          if (currentVote === 'upvote') newUpvotes -= 1
          if (currentVote === 'downvote') newDownvotes -= 1
          if (voteType === 'upvote') newUpvotes += 1
          if (voteType === 'downvote') newDownvotes += 1
        } else {
          // New vote
          if (voteType === 'upvote') newUpvotes += 1
          if (voteType === 'downvote') newDownvotes += 1
        }

        const newVotesCount = newUpvotes - newDownvotes

        return { 
          ...a, 
          votes_count: newVotesCount, 
          upvotes: newUpvotes, 
          downvotes: newDownvotes, 
          user_vote: newUserVote 
        }
      }))

      // API call
      if (currentVote === voteType) {
        await votesApi.deleteVote(answerId)
      } else {
        await votesApi.castVote(answerId, voteType)
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to vote'
      setSubmitError(errorMessage)
      showToast(errorMessage, 'error')
      
      // Refresh on error
      const answersData = await answersApi.getByQuestion(id)
      setAnswers(answersData)
    }
  }

  const handleEditAnswer = (answer: Answer) => {
    setEditingAnswerId(answer.id)
    setEditText(answer.body)
  }

  const handleUpdateAnswer = async (answerId: string) => {
    if (!editText.trim()) return
    
    try {
      await answersApi.update(answerId, editText)
      setAnswers(prev => prev.map(a => 
        a.id === answerId ? { 
          ...a, 
          body: editText, 
          updated_at: new Date().toISOString() 
        } : a
      ))
      setEditingAnswerId(null)
      setEditText('')
      showToast('Answer updated successfully!', 'success')
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update answer'
      setSubmitError(errorMessage)
      showToast(errorMessage, 'error')
    }
  }

  const handleDeleteAnswer = async (answerId: string) => {
    try {
      await answersApi.delete(answerId)
      setAnswers(prev => prev.filter(a => a.id !== answerId))
      setDeleteConfirmId(null)
      showToast('Answer deleted successfully!', 'success')
      
      // Update question answer count
      setQuestion(prev => {
        if (!prev) return prev
        const currentCount = Number(prev.answers_count) || 0
        return {
          ...prev,
          answers_count: Math.max(currentCount - 1, 0)
        }
      })
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete answer'
      setSubmitError(errorMessage)
      showToast(errorMessage, 'error')
      setDeleteConfirmId(null)
    }
  }

 // Accept answer
const handleAcceptAnswer = async (answerId: string) => {
  if (!user || !question || question.author_id !== user.id) return
  
  try {
    await answersApi.accept(answerId)
    
    // Update local state
    setAnswers(prev => prev.map(a => ({
      ...a,
      is_accepted: a.id === answerId
    })))
    
    showToast('Answer accepted!', 'success')
    
  } catch (err: any) {
    const errorMessage = err.message || 'Failed to accept answer'
    setSubmitError(errorMessage)
    showToast(errorMessage, 'error')
  }
}

  // Generate AI Summary
const generateAISummary = async () => {
  if (!user) {
    showToast('Please log in to generate AI summary', 'error')
    return
  }

  try {
    setGeneratingSummary(true)
    setAiError(null)
    setShowAIFeatures(true)
    
    console.log('🔄 Starting AI generation for question:', question!.id)
    
    // Test each API call individually
    console.log('📝 Testing quickSummary API...')
    const summaryResponse = await aiApi.quickSummary(question!.body, question!.id)
    console.log('📝 quickSummary RAW RESPONSE:', summaryResponse)
    
    if (summaryResponse.success) {
      console.log('✅ quickSummary SUCCESS:', summaryResponse.data)
      setAiSummary({
        id: 'temp',
        question_id: question!.id,
        summary: summaryResponse.data,
        model_info: 'Gemini 2.5 Flash',
        created_at: new Date().toISOString()
      })
    } else {
      console.log('❌ quickSummary FAILED:', summaryResponse.message)
      throw new Error(summaryResponse.message || 'Quick summary failed')
    }

    console.log('🏷️ Testing detectContentType API...')
    const typeResponse = await aiApi.detectContentType(question!.title + ' ' + question!.body, question!.id)
    console.log('🏷️ detectContentType RAW RESPONSE:', typeResponse)
    
    if (typeResponse.success) {
      console.log('✅ detectContentType SUCCESS:', typeResponse.data)
      setContentType(typeResponse.data)
    } else {
      console.log('❌ detectContentType FAILED:', typeResponse.message)
      // Don't throw error here - continue with other calls
    }

    console.log('🔍 Testing detectDuplicates API...')
    const similarResponse = await aiApi.detectDuplicates(question!.title, question!.id)
    console.log('🔍 detectDuplicates RAW RESPONSE:', similarResponse)
    
    if (similarResponse.success && similarResponse.data) {
      console.log('✅ detectDuplicates SUCCESS:', similarResponse.data)
      const similar = similarResponse.data.split('\n').filter((q: string) => q.trim().length > 0)
      setSimilarQuestions(similar.slice(0, 3))
    } else {
      console.log('❌ detectDuplicates FAILED:', similarResponse.message)
      // Don't throw error here - continue
    }

    showToast('AI insights generated successfully!', 'success')
    console.log('🎉 ALL AI generation completed!')
    
  } catch (err: any) {
    console.error('💥 AI generation CRASHED:', err)
    console.error('💥 Error details:', err.response || err.message || err)
    setAiError(err.message || 'Failed to generate AI insights')
    showToast('Failed to generate AI insights', 'error')
  } finally {
    setGeneratingSummary(false)
  }
}

// fetch AI summary
  useEffect(() => {
    const fetchAISummary = async (questionId: string) => {
      try {
        setAiLoading(true)
        setAiError(null)
        const summary = await aiApi.quickSummary(questionId)
        setAiSummary(summary.data)
        setAiError(null)
      } catch (err: any) {
        if (!err.message.includes('No AI summary found') && !err.message.includes('404')) {
          setAiError(err.message || 'Failed to fetch AI summary')
        }
        setAiSummary(null)
      } finally {
        setAiLoading(false)
      }
    }

    if (id) {
      fetchAISummary(id)
    }
  }, [id])



 const AnswerItem = ({ answer }: { answer: Answer }) => {
  const isOwner = user?.id === answer.user_id
  const isQuestionOwner = user?.id === question?.author_id
  const wasEdited = answer.updated_at && answer.updated_at !== answer.created_at
  
  return (
    <div
      className={`border border-border rounded-lg p-4 ${
        answer.is_accepted
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-card'
      }`}
    >
      {/* Answer Header - Like social media post header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar name={answer.author_name} image={answer.avatar_url} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm">
                {answer.author_name}
              </span>
              {isOwner && (
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                  You
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatTime(answer.created_at)}</span>
              {wasEdited && <span className="italic">(edited)</span>}
              {answer.is_accepted && (
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <Check className="h-3 w-3" />
                  Accepted
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons - always visible for owners */}
        <div className="flex items-center gap-1">
          {/* Accept Answer button for question owner */}
          {isQuestionOwner && !answer.is_accepted && (
            <button
              onClick={() => handleAcceptAnswer(answer.id)}
              className="p-1.5 text-muted-foreground hover:text-green-600 transition-colors rounded"
              title="Accept this answer"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          
          {/* Edit/Delete buttons for answer owner */}
          {isOwner && (
            <>
              <button
                onClick={() => handleEditAnswer(answer)}
                className="p-1.5 text-muted-foreground hover:text-blue-600 transition-colors rounded"
                title="Edit answer"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeleteConfirmId(answer.id)}
                className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors rounded"
                title="Delete answer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Answer Content */}
      {editingAnswerId === answer.id ? (
        <div className="space-y-3">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full h-32 p-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground resize-y"
            placeholder="Edit your answer..."
            autoFocus
          />
          <div className="flex gap-2">
            <Button 
              onClick={() => handleUpdateAnswer(answer.id)}
              className="bg-green-500 hover:bg-green-600 text-white text-sm"
              disabled={!editText.trim()}
            >
              Save Changes
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setEditingAnswerId(null)
                setEditText('')
              }}
              className="text-sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="prose prose-sm max-w-none dark:prose-invert mb-3">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={MarkdownComponents}
            >
              {answer.body}
            </ReactMarkdown>
          </div>
          
          {/* Voting and stats - at the bottom like social media */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center gap-4">
              {/* Upvote button */}
              <button 
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                  answer.user_vote === 'upvote' 
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => handleVote(answer.id, 'upvote')}
              >
                <ArrowUp className="h-4 w-4" />
                <span className="text-sm font-medium">{answer.upvotes}</span>
              </button>
              
              {/* Downvote button */}
              <button 
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                  answer.user_vote === 'downvote' 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => handleVote(answer.id, 'downvote')}
              >
                <ArrowDown className="h-4 w-4" />
                <span className="text-sm font-medium">{answer.downvotes}</span>
              </button>
              
              {/* Total votes */}
              <span className="text-sm text-muted-foreground font-medium">
                {answer.votes_count} votes
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

    if (loading)
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
        </div>
      </div>
    )

   if (error)
    return (
      <div className="max-w-4xl mx-auto p-6 text-red-500">
        Error loading question: {error}
      </div>
    )

   if (!question)
    return <div className="max-w-4xl mx-auto p-6">Question not found.</div>
    
return (
  <div className="max-w-4xl mx-auto p-4 sm:p-6">
    {/* Toast Notification */}
    {toast && (
      <div className={`fixed top-4 right-4 p-4 rounded-lg z-50 shadow-lg max-w-sm ${
        toast.type === 'success' 
          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
          : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
      }`}>
        {toast.message}
      </div>
    )}

    {/* Delete Confirmation Modal */}
    {deleteConfirmId && (
      <DeleteConfirmation
        answerId={deleteConfirmId}
        onConfirm={handleDeleteAnswer}
        onCancel={() => setDeleteConfirmId(null)}
      />
    )}

    {/* Question Header */}
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6">
      <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight break-words mb-4">
        {question.title}
      </h1>

      {/* Question Body with Markdown */}
      <div className="prose prose-sm max-w-none dark:prose-invert mb-4 text-foreground">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={MarkdownComponents}
        >
          {question.body}
        </ReactMarkdown>
      </div>
      
      {/* Question Image */}
      {question.image_url && (
        <div className="mb-4">
          <img 
            src={question.image_url} 
            alt="Question image" 
            className="w-full max-h-64 sm:max-h-80 object-contain rounded-lg border border-border"
          />
        </div>
      )}

      {/* Question Metadata */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground pt-4 border-t border-border/50">
        <Avatar name={question.author_name} image={question.avatar_url} />
        <span className="font-semibold text-foreground">{question.author_name}</span>
        {user?.id === question.author_id && (
          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
            You
          </span>
        )}
        <span>•</span>
        <span>{formatTime(question.created_at)}</span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Eye className="h-4 w-4" />
          {question.views_count} views
        </span>
      </div>
    </div>

    {/* Answers Section */}
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-3">
        <MessageCircle className="h-5 w-5 text-blue-500" />
        {typeof question.answers_count === 'number' ? question.answers_count : Number(question.answers_count) || 0} 
        {question.answers_count === 1 ? ' Answer' : ' Answers'}
      </h2>

      {answers.length > 0 ? (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {answers.map(a => (
            <AnswerItem key={a.id} answer={a} />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-8 border-2 border-dashed border-border rounded-lg bg-muted/10">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No answers yet</p>
          <p className="mb-4">Be the first to share your knowledge!</p>
          {user && (
            <Button 
              onClick={() => document.getElementById('answer-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Write First Answer
            </Button>
          )}
        </div>
      )}

      {/* Answer Form */}
      <div id="answer-form" className="mt-8 pt-6 border-t border-border/50">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-3">
          <Edit className="h-5 w-5 text-green-500" />
          Your Answer
        </h3>
        
        {!user ? (
          <div className="text-center py-6 border-2 border-dashed border-border rounded-lg bg-muted/10">
            <MessageCircle className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Join the discussion and share your knowledge
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button 
                onClick={() => (window.location.href = '/login')}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Log In to Answer
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = '/register')}
              >
                Sign Up
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Pro Tip:</strong> Use Markdown for formatting - **bold**, *italic*, `code`, etc.
              </p>
            </div>
            
            <textarea
              value={answerText}
              onChange={e => setAnswerText(e.target.value)}
              placeholder="Share your solution here..."
              className="w-full h-32 p-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground resize-y"
              disabled={submitting}
            />
            
            <Button
              onClick={handleSubmitAnswer}
              disabled={submitting || !answerText.trim()}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Posting Answer...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Post Your Answer
                </div>
              )}
            </Button>
          </>
        )}
      </div>
    </div>

    {/* Custom Scrollbar Styles */}
    <style jsx global>{`
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
      .dark .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #475569;
      }
      .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #64748b;
      }
    `}</style>
  </div>
)
}