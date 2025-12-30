// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface ApiOptions extends RequestInit {
  method?: HttpMethod
  body?: any
}

async function apiClient<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  console.log('🔄 API Call:', url, options)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }

  if (options.body && !(options.method?.toUpperCase() === 'GET' || options.method?.toUpperCase() === 'HEAD')) {
    config.body = JSON.stringify(options.body)
  }

  try {
    const response = await fetch(url, config)
    console.log('📡 API Response Status:', response.status)

    // 🔥 FIX: Only handle redirect if we're in the browser
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      throw new Error('Token expired - redirected to login')
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => null)
      throw new Error(`API error: ${response.status} - ${response.statusText} | ${JSON.stringify(errBody)}`)
    }

    const data = await response.json()
    console.log('✅ API Response Data:', data)
    return data
  } catch (error: any) {
    console.error('❌ API Call Failed:', error)
    throw error
  }
}


// ===== Auth API =====
export const authApi = {
  login: (email: string, password: string) =>
    apiClient<{ user: any; token: string }>('/auth/login', { method: 'POST', body: { email, password } }),

  register: (name: string, email: string, password: string) =>
    apiClient<{ user: any; token: string }>('/auth/register', { method: 'POST', body: { name, email, password } }),

  test: () => apiClient('/auth/test'),
}

// ===== Questions API =====
export const questionsApi = {
  getAll: () => apiClient('/questions'),
  getPaginated: (page: number, limit: number = 10) =>
    apiClient(`/questions/paginated?page=${page}&limit=${limit}`),
  getById: (id: string) => apiClient(`/questions/${id}`),
  getBySlug: (slug: string) => apiClient(`/questions/${slug}`),
  create: (question: { title: string; body: string; tags?: string[]; image_url?: string }) =>
    apiClient('/questions', { method: 'POST', body: question }),
  update: (id: string, question: { title?: string; body?: string; tags?: string[]; image_url?: string }) =>
    apiClient(`/questions/${id}`, { method: 'PUT', body: question }),
  delete: (id: string) => apiClient(`/questions/${id}`, { method: 'DELETE' }),
  incrementViews: (identifier: string) => 
    apiClient(`/questions/${identifier}/views`, { method: 'POST' }),
    
  // For question voting 
  castVote: (identifier: string, vote_type: 'upvote' | 'downvote') => 
    apiClient(`/questions/${identifier}/votes`, { method: 'POST', body: { vote_type } }), 

  deleteVote: (identifier: string) => 
    apiClient(`/questions/${identifier}/votes`, { method: 'DELETE' }),

  getVotes: (identifier: string) => 
    apiClient(`/questions/${identifier}/votes`),

  getTrending: (timeframe?: 'today' | 'week' | 'month') =>
    apiClient(`/questions/trending?timeframe=${timeframe || 'week'}`),
}

// ===== Answers API =====
export const answersApi = {
  getAll: () => apiClient('/answers'),
  getByQuestion: (questionId: string) => apiClient(`/answers/question/${questionId}`),
  getById: (id: string) => apiClient(`/answers/${id}`),
  
  // ✅ FIXED: Correct parameter name to match backend
  create: (questionId: string, body: string, image_url?: string) =>
    apiClient(`/answers/question/${questionId}`, { 
      method: 'POST', 
      body: { body, image_url } 
    }),

    //  Record activity for answer acceptance
    accept: (id: string) => apiClient(`/answers/${id}/accept`, { method: 'PATCH' }),

  // ✅ FIXED: Use 'body' instead of 'content' to match backend
  update: (id: string, body: string) =>
    apiClient(`/answers/${id}`, { method: 'PUT', body: { body } }),
    
  delete: (id: string) => apiClient(`/answers/${id}`, { method: 'DELETE' }),
}

// ===== Votes API =====
export const votesApi = {
  // ✅ FIXED: Use correct vote_type values ('upvote'/'downvote') to match backend
  castVote: (answer_id: string, vote_type: 'upvote' | 'downvote') =>
    apiClient('/votes', { method: 'POST', body: { answer_id, vote_type } }),
    
  deleteVote: (answer_id: string) => apiClient(`/votes/${answer_id}`, { method: 'DELETE' }),
  
  getVotes: (answer_id: string) => apiClient(`/votes/${answer_id}`),
}


// ===== Users API =====
export const usersApi = {
  getMe: () => apiClient('/users/me'),
  getById: (id: string) => apiClient(`/users/${id}`),
  getBySlug: (slug: string) => apiClient(`/users/${slug}`), 
  getAll: () => apiClient('/users'), // Admin only
  getPublicUsers: () => apiClient('/users/public/list'),
  update: (id: string, userData: any) => apiClient(`/users/${id}`, { method: 'PUT', body: userData }),
  delete: (id: string) => apiClient(`/users/${id}`, { method: 'DELETE' }),
  
  getUserQuestions: (identifier: string) => apiClient(`/users/${identifier}/questions`), 
  getUserAnswers: (identifier: string) => apiClient(`/users/${identifier}/answers`), 
  getUserStats: (identifier: string) => apiClient(`/users/${identifier}/stats`), 
};

// Activity API
export const activitiesApi = {
  // Get current user's activities
  getMyActivities: (params?: { limit?: number; offset?: number }) => 
    apiClient(`/activities/me?${new URLSearchParams(params as any)}`),
  
  // Get activities for specific user
  getUserActivities: (userId: string, params?: { limit?: number; offset?: number }) => 
    apiClient(`/activities/user/${userId}?${new URLSearchParams(params as any)}`),
  
  // Get activity feed (for followed users)
  getActivityFeed: (params?: { limit?: number }) => 
    apiClient(`/activities/feed?${new URLSearchParams(params as any)}`),
  
  // Get activity types
  getActivityTypes: () => apiClient('/activities/types'),
};


// ===== Notifications API =====
export const notificationsApi = {
  getAll: (params?: { limit?: number; offset?: number }) => 
    apiClient(`/notifications?${new URLSearchParams(params as any)}`),
  
  getUnreadCount: () => apiClient('/notifications/unread-count'),
  
  markAsRead: (id: string) => 
    apiClient(`/notifications/${id}/read`, { method: 'PATCH' }),
    
  markAllAsRead: () => 
    apiClient('/notifications/read-all', { method: 'PATCH' }),
}

// ===== Search API =====
export const searchApi = {
  search: (query: string) => 
    apiClient(`/search?q=${encodeURIComponent(query)}`),
  
  // Advanced search with filters
  advancedSearch: (params: { 
    q: string; 
    type?: 'questions' | 'answers' | 'users' | 'tags' | 'all';
    limit?: number;
  }) => 
    apiClient(`/search/advanced?${new URLSearchParams(params as any)}`),
}

// ===== Bookmarks API =====
export const bookmarksApi = {
  // Add bookmark
  add: (question_id: string) =>
    apiClient('/bookmarks', { method: 'POST', body: { question_id } }),
  
  // Remove bookmark  
  remove: (questionId: string) =>
    apiClient(`/bookmarks/${questionId}`, { method: 'DELETE' }),
  
  // Get user's bookmarks
  getMyBookmarks: (params?: { limit?: number; offset?: number }) =>
    apiClient(`/bookmarks/me?${new URLSearchParams(params as any)}`),
  
  // Check if bookmarked
  check: (questionId: string) =>
    apiClient(`/bookmarks/check/${questionId}`),
  
  // Get bookmark count
  getCount: (questionId: string) =>
    apiClient(`/bookmarks/count/${questionId}`),
};

// ===== Settings API =====
export const settingsApi = {
  // Get user settings
  getSettings: () => apiClient('/users/settings'),
  
  // Update user settings
  updateSettings: (settings: UserSettings) => 
    apiClient('/users/settings', { method: 'PUT', body: settings }),
}

// Types
export interface UserSettings {
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: string
    timezone: string
    date_format: string
  }
  notifications: {
    email_notifications: boolean
    new_answers: boolean
    mentions: boolean
    weekly_digest: boolean
  }
  privacy: {
    show_email: boolean
    show_activity: boolean
    profile_visibility: 'public' | 'private' | 'friends_only'
  }
  email_preferences: {
    marketing_emails: boolean
    product_updates: boolean
    community_digest: boolean
  }
}


// ===== AI API =====
export const aiApi = {
  // Main AI analysis endpoint - handles all 12 features
  analyze: (data: {
    feature: string;
    content: string;
    sourceId?: string;
    targetLang?: string;
    additionalData?: any;
  }) => apiClient('/ai/analyze', { method: 'POST', body: data }),

  // Batch processing
  batchAnalyze: (analyses: Array<{
    feature: string;
    content: string;
    sourceId?: string;
  }>) => apiClient('/ai/analyze/batch', { method: 'POST', body: { analyses } }),

  // Get cached AI content
  getCached: (sourceId: string, feature: string) => 
    apiClient(`/ai/cached/${sourceId}/${feature}`),

  // Individual feature endpoints (convenience)
  suggestTags: (content: string, sourceId?: string) =>
    apiClient('/ai/suggest-tags', { method: 'POST', body: { content, sourceId } }),

  rewriteTitle: (content: string, sourceId?: string) =>
    apiClient('/ai/rewrite-title', { method: 'POST', body: { content, sourceId } }),

  rewriteDescription: (content: string, sourceId?: string) =>
    apiClient('/ai/rewrite-description', { method: 'POST', body: { content, sourceId } }),

  qualityScore: (content: string, sourceId?: string) =>
    apiClient('/ai/quality-score', { method: 'POST', body: { content, sourceId } }),

  detectDuplicates: (content: string, sourceId?: string) =>
    apiClient('/ai/detect-duplicates', { method: 'POST', body: { content, sourceId } }),

  quickSummary: (content: string, sourceId?: string) =>
    apiClient('/ai/quick-summary', { method: 'POST', body: { content, sourceId } }),

  autoTranslate: (content: string, targetLang: string, sourceId?: string) =>
    apiClient('/ai/auto-translate', { method: 'POST', body: { content, targetLang, sourceId } }),

  detectContentType: (content: string, sourceId?: string) =>
    apiClient('/ai/content-type', { method: 'POST', body: { content, sourceId } }),

  codeReview: (content: string, sourceId?: string) =>
    apiClient('/ai/code-review', { method: 'POST', body: { content, sourceId } }),

  personalizeFeed: (content: string, sourceId?: string) =>
    apiClient('/ai/personalize-feed', { method: 'POST', body: { content, sourceId } }),

  enhanceSearch: (content: string, sourceId?: string) =>
    apiClient('/ai/enhance-search', { method: 'POST', body: { content, sourceId } }),

  bestAnswerSummary: (question: string, answers: string[], sourceId?: string) =>
    apiClient('/ai/best-answer-summary', { 
      method: 'POST', 
      body: { 
        content: question, 
        additionalData: { answers },
        sourceId 
      } 
    }),
}

// ===== Chat API =====
export const chatApi = {
  // Conversations
  startConversation: (title?: string) => 
    apiClient('/chat/conversations', { method: 'POST', body: { title } }),
  
  getConversations: () => 
    apiClient('/chat/conversations'),
  
  getConversation: (conversationId: string) => 
    apiClient(`/chat/conversations/${conversationId}`),
  
  deleteConversation: (conversationId: string) => 
    apiClient(`/chat/conversations/${conversationId}`, { method: 'DELETE' }),
  
  // Messages
  sendMessage: (conversationId: string, message: string) => 
    apiClient('/chat/messages', { 
      method: 'POST', 
      body: { conversationId, message } 
    }),
  
  // Quick chat
  quickChat: (message: string) =>
    apiClient('/chat/quick-chat', {
      method: 'POST',
      body: { message }
    })
}

// ===== Stats API =====
export const statsApi = {
  getStats: () => apiClient('/stats'),
}

// ===== OAuth URLs =====
export const oauthUrls = {
  google: `${API_BASE_URL}/oauth/google`,
  github: `${API_BASE_URL}/oauth/github`,
}