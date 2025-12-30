'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { usersApi, activitiesApi } from '@/lib/api'
import { Calendar, BarChart3, MessageSquare, Eye, ThumbsUp, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface UserStats {
  questionsCount: number
  answersCount: number
  totalViews: number
  totalVotes: number
  acceptedAnswers: number
}

interface Activity {
  id: string
  type: string
  message: string
  metadata: any
  created_at: string
}

const getActivityConfig = (type: string, metadata: any) => {
  switch (type) {
    case 'question_asked':
      return { icon: '❓', color: 'text-blue-600', bgColor: 'bg-blue-100' }
    case 'question_edited':
      return { icon: '✏️', color: 'text-purple-600', bgColor: 'bg-purple-100' }
    case 'answer_posted':
      return { icon: '💬', color: 'text-green-600', bgColor: 'bg-green-100' }
    case 'answer_edited':
      return { icon: '📝', color: 'text-orange-600', bgColor: 'bg-orange-100' }
    case 'answer_accepted':
      return { icon: '✅', color: 'text-emerald-600', bgColor: 'bg-emerald-100' }
    case 'vote_cast':
      const isUpvote = metadata?.vote_type === 'upvote'
      return { 
        icon: isUpvote ? '⬆️' : '⬇️', 
        color: isUpvote ? 'text-green-600' : 'text-red-600',
        bgColor: isUpvote ? 'bg-green-100' : 'bg-red-100'
      }
    default:
      return { icon: '📝', color: 'text-gray-600', bgColor: 'bg-gray-100' }
  }
}

export default function UserProfilePage() {
  const params = useParams()
  const userId = params.id as string
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'answers'>('overview') // Removed 'activity'
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [userQuestions, setUserQuestions] = useState<any[]>([])
  const [userAnswers, setUserAnswers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return
      
      try {
        setLoading(true)
        setError(null)

        // Only fetch essential data - remove activities
        const [userData, stats, questions, answers] = await Promise.all([
          usersApi.getById(userId),
          usersApi.getUserStats(userId),
          usersApi.getUserQuestions(userId),
          usersApi.getUserAnswers(userId)
        ])

        setUser(userData)
        setUserStats(stats)
        setUserQuestions(questions)
        setUserAnswers(answers)
      } catch (err) {
        setError('Failed to load user profile')
        console.error('Error fetching user data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="animate-pulse space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-3">
              <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 sm:h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 text-center">
        <div className="bg-card border border-border rounded-lg p-6 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">User Not Found</h1>
          <p className="text-muted-foreground mb-4">The user you're looking for doesn't exist.</p>
          <button 
            onClick={() => (window.location.href = '/')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const formatJoinDate = () => {
    if (!user.created_at) return 'Recently'
    try {
      return new Date(user.created_at).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      })
    } catch {
      return 'Recently'
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header Section - READ ONLY */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg sm:text-xl md:text-2xl font-bold overflow-hidden">
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.name || user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{((user.name || user.username)?.[0] || 'U').toUpperCase()}</span>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground break-words">
                {user.name || user.username}
              </h1>
              {userStats && userStats.questionsCount + userStats.answersCount > 10 && (
                <span className="bg-purple-100 text-purple-800 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-medium border border-purple-200 self-start sm:self-auto">
                  Active Member
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                Joined {formatJoinDate()}
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                {userStats?.questionsCount || 0} questions • {userStats?.answersCount || 0} answers
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Questions</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{userStats?.questionsCount || 0}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Answers</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{userStats?.answersCount || 0}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{userStats?.totalViews || 0}</p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-100 rounded-full">
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Votes Received</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{userStats?.totalVotes || 0}</p>
              </div>
              <div className="p-2 sm:p-3 bg-orange-100 rounded-full">
                <ThumbsUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs - REMOVED ACTIVITY TAB */}
      <div className="border-b border-border mb-4 sm:mb-6">
        <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'questions', label: 'Questions', icon: MessageSquare },
            { id: 'answers', label: 'Answers', icon: Award }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-1 sm:gap-2 py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
            >
              <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.substring(0, 3)}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Recent Questions */}
            <Card className="lg:col-span-2 hover:shadow-md transition-shadow">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                  Recent Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {userQuestions.slice(0, 5).map((question) => (
                  <Link 
                    key={question.id} 
                    href={`/questions/${question.id}`}
                    className="block border-b border-border last:border-b-0 py-3 sm:py-4 hover:bg-muted/50 rounded-lg px-2 sm:px-3 -mx-2 sm:-mx-3 transition-colors"
                  >
                    <h3 className="font-semibold text-foreground hover:text-blue-600 mb-1 sm:mb-2 text-sm sm:text-base line-clamp-2">
                      {question.title}
                    </h3>
                    <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
                      <span>{question.answers_count} answers</span>
                      <span>{question.views_count} views</span>
                      <span>{new Date(question.created_at).toLocaleDateString()}</span>
                    </div>
                  </Link>
                ))}
                {userQuestions.length === 0 && (
                  <div className="text-center py-6 sm:py-8">
                    <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground text-sm sm:text-base">No questions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-lg">
                  <span className="text-xs sm:text-sm font-medium text-green-800">Accepted Answers</span>
                  <span className="font-semibold text-green-900 text-sm sm:text-base">{userStats?.acceptedAnswers || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <span className="text-xs sm:text-sm font-medium text-blue-800">Answer Rate</span>
                  <span className="font-semibold text-blue-900 text-sm sm:text-base">
                    {userStats?.questionsCount ? 
                      Math.round((userStats.answersCount / userStats.questionsCount) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 sm:p-3 bg-purple-50 rounded-lg">
                  <span className="text-xs sm:text-sm font-medium text-purple-800">Avg. Votes</span>
                  <span className="font-semibold text-purple-900 text-sm sm:text-base">
                    {userStats?.answersCount ? 
                      Math.round((userStats.totalVotes / userStats.answersCount) * 10) / 10 : 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'questions' && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                Questions ({userQuestions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {userQuestions.map((question) => (
                <Link 
                  key={question.id} 
                  href={`/questions/${question.id}`}
                  className="block border-b border-border last:border-b-0 py-4 sm:py-6 hover:bg-muted/50 rounded-lg px-3 sm:px-4 -mx-3 sm:-mx-4 transition-colors"
                >
                  <h3 className="font-semibold text-foreground hover:text-blue-600 mb-2 text-sm sm:text-base md:text-lg line-clamp-2">
                    {question.title}
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{question.body}</p>
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {question.answers_count} answers
                    </span>
                    <span>{question.views_count} views</span>
                    <span>{question.votes_count} votes</span>
                    <span>{new Date(question.created_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
              {userQuestions.length === 0 && (
                <div className="text-center py-8 sm:py-12">
                  <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">No questions yet</h3>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'answers' && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                Answers ({userAnswers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {userAnswers.map((answer) => (
                <Link 
                  key={answer.id} 
                  href={`/questions/${answer.question_id}`}
                  className="block border-b border-border last:border-b-0 py-4 sm:py-6 hover:bg-muted/50 rounded-lg px-3 sm:px-4 -mx-3 sm:-mx-4 transition-colors"
                >
                  <p className="text-foreground mb-2 sm:mb-3 text-sm sm:text-base line-clamp-2 sm:line-clamp-3">{answer.body}</p>
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      {answer.votes_count} votes
                    </span>
                    {answer.is_accepted && (
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
                        ✅ Accepted
                      </span>
                    )}
                    {answer.question_title && (
                      <span className="text-blue-600 font-medium" title={answer.question_title}>
                        Q: {answer.question_title.length > 40 
                          ? answer.question_title.substring(0, 40) + '...' 
                          : answer.question_title}
                      </span>
                    )}
                    <span>{new Date(answer.created_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
              {userAnswers.length === 0 && (
                <div className="text-center py-8 sm:py-12">
                  <Award className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">No answers yet</h3>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}