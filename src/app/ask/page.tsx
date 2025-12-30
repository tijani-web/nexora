'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Hash, Image, X, AtSign, Search, User, Sparkles, Wand2, AlertTriangle, CheckCircle, Bot, Zap, Crown, Gem, Brain, Rocket, Eye, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { questionsApi, usersApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useAISuggestions } from '@/hooks/useAiSuggestions'
import { debounce } from 'lodash'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface User {
  id: string
  name: string
  email: string
  avatar_url?: string
}

// Markdown Components for rich rendering (same as question detail)
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

export default function AskQuestionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { suggestTags, rewriteTitle, rateQuestionQuality, detectDuplicates, suggesting, error: aiError } = useAISuggestions()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    tags: [] as string[],
    image_url: '' as string | null
  })
  
  const [tagInput, setTagInput] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  // AI Features State
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [qualityFeedback, setQualityFeedback] = useState<{rating: number; suggestions: string} | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [aiTitleUsed, setAiTitleUsed] = useState(false)
  
  // Mention system states
  const [showMentionList, setShowMentionList] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPosition, setMentionPosition] = useState(0)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedUserIndex, setSelectedUserIndex] = useState(0)
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Load users for mentions
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true)
        const usersData = await usersApi.getPublicUsers()
        setUsers(usersData)
      } catch (error) {
        console.error('Failed to load users:', error)
        if (user) {
          setUsers([{
            id: user.id,
            name: user.username || user.username,
            email: user.email,
            avatar_url: user.avatar_url
          }])
        }
      } finally {
        setLoadingUsers(false)
      }
    }
    loadUsers()
  }, [user])

  // Filter users based on mention query
  useEffect(() => {
    if (mentionQuery) {
      const filtered = users.filter(u => 
        u.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(mentionQuery.toLowerCase())
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users.slice(0, 10))
    }
  }, [mentionQuery, users])

  // AI: Auto-suggest tags and check quality when title/body changes
  const analyzeContent = useCallback(
    debounce(async (title: string, body: string) => {
      if (!title.trim() && !body.trim()) return
      
      const content = `${title} ${body}`.trim()
      if (content.length < 10) return
      
      try {
        // Get tag suggestions
        const tags = await suggestTags(content)
        setSuggestedTags(tags)
        
        // Get quality score if we have enough content
        if (title.length > 5 && body.length > 20) {
          const qualityResult = await rateQuestionQuality(content)
          if (qualityResult) {
            setQualityFeedback(qualityResult)
          }
        }
        
        // Check for duplicates
        const duplicateResult = await detectDuplicates(title)
        if (duplicateResult) {
          setDuplicateWarning(duplicateResult)
        }
        
        setShowAISuggestions(true)
      } catch (err) {
        console.error('AI analysis failed:', err)
      }
    }, 1500),
    []
  )

  // Handle title change with AI analysis
  const handleTitleChange = (newTitle: string) => {
    setFormData(prev => ({ ...prev, title: newTitle }))
    setAiTitleUsed(false)
    analyzeContent(newTitle, formData.body)
  }

  // Handle body change with AI analysis
  const handleBodyChange = (newBody: string) => {
    setFormData(prev => ({ ...prev, body: newBody }))
    analyzeContent(formData.title, newBody)
  }

  // AI: Rewrite title
  const handleRewriteTitle = async () => {
    if (formData.title) {
      const betterTitle = await rewriteTitle(formData.title)
      if (betterTitle && betterTitle !== formData.title) {
        setFormData(prev => ({ ...prev, title: betterTitle }))
        setAiTitleUsed(true)
      }
    }
  }

  // AI: Add suggested tag
  const addSuggestedTag = (tag: string) => {
    if (!formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
      setSuggestedTags(prev => prev.filter(t => t !== tag))
    }
  }

  // Handle body keydown for mentions
  const handleBodyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === '@') {
      const textarea = textareaRef.current
      if (!textarea) return
      
      const cursorPosition = textarea.selectionStart
      setMentionPosition(cursorPosition)
      setShowMentionList(true)
      setMentionQuery('')
      setSelectedUserIndex(0)
    }

    if (showMentionList) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedUserIndex(prev => 
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedUserIndex(prev => 
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        )
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredUsers.length > 0) {
          selectUser(filteredUsers[selectedUserIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setShowMentionList(false)
      }
    }
  }

  const handleBodyChangeWithMentions = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    handleBodyChange(value)

    if (showMentionList) {
      const textBeforeCursor = value.slice(mentionPosition, e.target.selectionStart)
      const queryMatch = textBeforeCursor.match(/@(\w*)$/)
      
      if (queryMatch) {
        setMentionQuery(queryMatch[1])
      } else {
        setShowMentionList(false)
      }
    }
  }

  const selectUser = (selectedUser: User) => {
    if (!textareaRef.current) return

    const textBefore = formData.body.slice(0, mentionPosition)
    const textAfter = formData.body.slice(textareaRef.current.selectionStart)
    const mentionText = `@${selectedUser.name} `
    
    const newBody = textBefore + mentionText + textAfter
    setFormData(prev => ({ ...prev, body: newBody }))
    
    setShowMentionList(false)
    setMentionQuery('')
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionPosition + mentionText.length
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  // Image upload function
  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      console.log('☁️ Uploading to Cloudinary...', file.name);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
      formData.append('folder', 'nexora');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      setError('Failed to upload image to cloud');
      return null;
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
    setUploadingImage(true)
    
    const imageUrl = await handleImageUpload(file)
    setUploadingImage(false)

    if (imageUrl) {
      setFormData(prev => ({ ...prev, image_url: imageUrl }))
    } else {
      setImagePreview(null)
      setError('Failed to upload image')
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setFormData(prev => ({ ...prev, image_url: null }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('Please log in to ask a question')
      return
    }

    if (!formData.title.trim() || !formData.body.trim()) {
      setError('Title and description are required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const question = await questionsApi.create({
        title: formData.title.trim(),
        body: formData.body.trim(),
        tags: formData.tags,
        image_url: formData.image_url || undefined
      })

      if (!question.id) throw new Error('Question creation failed')
      router.push(`/`)
      
    } catch (err: any) {
      console.error('Question creation error:', err)
      setError(err.message || 'Failed to create question')
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/80 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="relative inline-block">
            <Bot className="h-20 w-20 mx-auto mb-4 text-purple-500" />
            <div className="absolute -top-1 -right-1">
              <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            Join Nexora AI
          </h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Access AI-powered question assistance and join our knowledge community
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => router.push('/login')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Rocket className="h-4 w-4 mr-2" />
              Sign In
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/register')}
              className="px-8 py-3 rounded-xl border-2 font-semibold hover:bg-accent transition-all"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
        {/* Premium Header - Responsive */}
        <div className="flex items-center gap-4 lg:gap-6 mb-8 lg:mb-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10 lg:h-12 lg:w-12 hover:bg-accent/50 rounded-xl border border-border/50 transition-all hover:scale-105"
          >
            <ArrowLeft className="h-5 w-5 lg:h-6 lg:w-6" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 lg:gap-3 mb-2">
              <div className="relative">
                <Bot className="h-6 w-6 lg:h-8 lg:w-8 text-purple-500" />
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="h-3 w-3 lg:h-4 lg:w-4 text-yellow-500 animate-pulse" />
                </div>
              </div>
              <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                Ask with AI
              </h1>
            </div>
            <p className="text-muted-foreground text-sm lg:text-lg">
              Get instant AI assistance while crafting your question
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 lg:gap-8">
          {/* Main Form - Responsive */}
          <div className="xl:col-span-3 space-y-6 lg:space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
              {/* Premium Title Card - Responsive */}
              <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0 mb-6">
                  <div className="flex items-center gap-3">
                    <Crown className="h-5 w-5 lg:h-6 lg:w-6 text-yellow-500" />
                    <label className="block text-lg lg:text-xl font-bold text-foreground">
                      Question Title
                    </label>
                  </div>
                  <Button
                    type="button"
                    onClick={handleRewriteTitle}
                    disabled={suggesting || !formData.title.trim()}
                    className={`flex items-center gap-2 lg:gap-3 px-4 lg:px-6 py-2 lg:py-3 rounded-xl font-semibold transition-all ${
                      aiTitleUsed 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg'
                        : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {suggesting ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 lg:h-4 lg:w-4 border-2 border-white border-t-transparent"></div>
                        <span className="text-sm lg:text-base">AI Thinking...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-3 w-3 lg:h-4 lg:w-4" />
                        <span className="text-sm lg:text-base">
                          {aiTitleUsed ? 'Enhanced! ✨' : 'Enhance with AI'}
                        </span>
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="relative">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="What's your programming challenge?"
                    className="w-full p-4 lg:p-5 text-base lg:text-lg border-2 border-border/50 rounded-xl bg-background/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    maxLength={150}
                  />
                  {aiTitleUsed && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Gem className="h-4 w-4 lg:h-5 lg:w-5 text-green-500 animate-pulse" />
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <p className="text-xs lg:text-sm text-muted-foreground">
                    Be specific about your technical challenge
                  </p>
                  <span className={`text-xs lg:text-sm font-medium ${
                    formData.title.length > 120 ? 'text-amber-500' : 'text-muted-foreground'
                  }`}>
                    {formData.title.length}/150
                  </span>
                </div>

                {/* Premium Quality Feedback */}
                {qualityFeedback && (
                  <div className={`mt-4 lg:mt-6 p-3 lg:p-4 rounded-xl border-2 backdrop-blur-sm ${
                    qualityFeedback.rating >= 8 
                      ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20' 
                      : qualityFeedback.rating >= 6 
                      ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20'
                      : 'bg-gradient-to-r from-red-500/10 to-pink-500/10 border-red-500/20'
                  }`}>
                    <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
                      {qualityFeedback.rating >= 8 ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-green-500" />
                          <span className="font-bold text-green-600 text-sm lg:text-base">Excellent! {qualityFeedback.rating}/10</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 lg:h-5 lg:w-5 text-amber-500" />
                          <span className="font-bold text-amber-600 text-sm lg:text-base">Good Start {qualityFeedback.rating}/10</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs lg:text-sm text-muted-foreground">
                      {qualityFeedback.suggestions}
                    </p>
                  </div>
                )}

                {/* Premium Duplicate Warning */}
                {duplicateWarning && (
                  <div className="mt-4 p-3 lg:p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/20 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center gap-2 lg:gap-3 mb-2">
                      <Brain className="h-4 w-4 lg:h-5 lg:w-5 text-blue-500" />
                      <span className="font-bold text-blue-600 text-sm lg:text-base">Similar Questions Found</span>
                    </div>
                    <p className="text-xs lg:text-sm text-blue-600/80">{duplicateWarning}</p>
                  </div>
                )}
              </div>

              {/* Premium Description Card - Responsive */}
              <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0 mb-6">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 lg:h-6 lg:w-6 text-blue-500" />
                    <label className="block text-lg lg:text-xl font-bold text-foreground">
                      Detailed Description
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl border-2 text-sm"
                    >
                      <Eye className="h-3 w-3 lg:h-4 lg:w-4" />
                      {showPreview ? 'Edit' : 'Preview'}
                    </Button>
                    <div className="flex items-center gap-2 text-xs lg:text-sm bg-blue-500/10 text-blue-600 px-2 lg:px-3 py-1 lg:py-2 rounded-lg border border-blue-500/20">
                      <AtSign className="h-3 w-3 lg:h-4 lg:w-4" />
                      <span>Type @ to mention</span>
                    </div>
                  </div>
                </div>
                  {/*  Pro Tip Section */}
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Pro Tip:</strong> Use Markdown for rich formatting - **bold**, *italic*, `code`, lists, and code blocks with syntax highlighting!
                  </p>
                </div>

                <div className="relative">
                  {showPreview ? (
                    <div className="min-h-[200px] lg:min-h-[300px] p-4 lg:p-5 border-2 border-border/50 rounded-xl bg-background/50">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={MarkdownComponents}
                        >
                          {formData.body || '*Your question preview will appear here*'}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <textarea
                      ref={textareaRef}
                      value={formData.body}
                      onChange={handleBodyChangeWithMentions}
                      onKeyDown={handleBodyKeyDown}
                      placeholder={`Describe your challenge in detail...

You can use Markdown formatting:
**Bold text**
*Italic text*
\`inline code\`

Code blocks:
\`\`\`javascript
// Your code here
console.log("Hello World!");
\`\`\`

• What specific problem are you facing?
• Include relevant code snippets
• What have you tried so far?
• What error messages are you seeing?
• Use @username to mention collaborators`}
                      rows={12}
                      className="w-full p-4 lg:p-5 border-2 border-border/50 rounded-xl bg-background/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical font-mono text-sm leading-relaxed transition-all"
                    />
                  )}

                  {/* Premium Mention Dropdown - Responsive */}
                  {showMentionList && (
                    <div className="absolute z-50 w-full lg:w-80 bg-card border-2 border-border/50 rounded-xl shadow-2xl max-h-60 overflow-y-auto top-full mt-2 backdrop-blur-sm">
                      <div className="p-3 border-b border-border/50 bg-card/80">
                        <div className="flex items-center gap-2 px-2 py-2">
                          <Search className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
                          <input
                            type="text"
                            value={mentionQuery}
                            onChange={(e) => setMentionQuery(e.target.value)}
                            placeholder="Search users..."
                            className="flex-1 bg-transparent outline-none text-sm font-medium"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="py-2">
                        {loadingUsers ? (
                          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                            <div className="animate-spin rounded-full h-5 w-5 lg:h-6 lg:w-6 border-2 border-purple-500 border-t-transparent mx-auto mb-2"></div>
                            Loading users...
                          </div>
                        ) : filteredUsers.length > 0 ? (
                          filteredUsers.map((user, index) => (
                            <div
                              key={user.id}
                              className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 cursor-pointer transition-all ${
                                index === selectedUserIndex 
                                  ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-l-4 border-purple-500' 
                                  : 'hover:bg-accent/50'
                              }`}
                              onClick={() => selectUser(user)}
                            >
                              <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs lg:text-sm font-bold">
                                {user.avatar_url ? (
                                  <img src={user.avatar_url} alt="" className="w-full h-full rounded-full" />
                                ) : (
                                  <User className="h-3 w-3 lg:h-4 lg:w-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs lg:text-sm font-semibold text-foreground truncate">
                                  {user.name}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                            No users found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Premium AI Suggested Tags - Responsive */}
              {showAISuggestions && suggestedTags.length > 0 && (
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border-2 border-purple-500/20 p-6 lg:p-8 shadow-xl">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-0 mb-4 lg:mb-6">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 lg:h-6 lg:w-6 text-purple-500 animate-pulse" />
                      <h3 className="text-lg lg:text-xl font-bold text-foreground">AI Suggested Tags</h3>
                    </div>
                    <div className="ml-auto bg-purple-500/20 text-purple-600 px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm font-semibold">
                      Smart Picks
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:gap-3">
                    {suggestedTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addSuggestedTag(tag)}
                        className="group flex items-center gap-1 lg:gap-2 bg-gradient-to-r from-white to-white/90 dark:from-gray-800 dark:to-gray-800/90 text-gray-800 dark:text-gray-200 px-3 lg:px-4 py-2 lg:py-3 rounded-xl text-xs lg:text-sm font-semibold border-2 border-purple-200 dark:border-purple-500/30 hover:border-purple-500 hover:scale-105 hover:shadow-lg transition-all duration-200"
                      >
                        <Hash className="h-3 w-3 lg:h-4 lg:w-4 text-purple-500" />
                        {tag}
                        <span className="text-purple-500 font-bold text-base lg:text-lg group-hover:scale-110 transition-transform">+</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs lg:text-sm text-muted-foreground mt-3 lg:mt-4 text-center">
                    Click to add AI-recommended tags for better visibility
                  </p>
                </div>
              )}

              {/*  Image Upload Card - Responsive */}
              <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
                <label className="text-lg lg:text-xl font-bold text-foreground mb-4 lg:mb-6 flex items-center gap-3">
                  <Image className="h-5 w-5 lg:h-6 lg:w-6 text-blue-500" />
                  Add Image (Optional)
                </label>
                
                {imagePreview ? (
                  <div className="space-y-4 lg:space-y-6">
                    <div className="relative inline-block group">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="max-w-full h-48 lg:h-72 object-contain rounded-2xl border-2 border-border/50 shadow-lg group-hover:shadow-xl transition-all"
                      />
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={removeImage}
                        className="absolute top-2 lg:top-4 right-2 lg:right-4 bg-red-500/90 hover:bg-red-600 backdrop-blur-sm border-0 shadow-lg hover:scale-110 transition-all h-8 w-8 lg:h-10 lg:w-10"
                      >
                        <X className="h-3 w-3 lg:h-4 lg:w-4" />
                      </Button>
                    </div>
                    {uploadingImage && (
                      <div className="flex items-center gap-2 lg:gap-3 text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 lg:h-5 lg:w-5 border-2 border-blue-500 border-t-transparent"></div>
                        <p className="font-medium text-sm lg:text-base">Uploading to cloud...</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div 
                    className="border-3 border-dashed border-border/50 rounded-2xl p-6 lg:p-12 text-center cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-500/5 group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Image className="h-12 w-12 lg:h-16 lg:w-16 text-muted-foreground mx-auto mb-4 lg:mb-6 group-hover:text-blue-500 transition-colors" />
                    <p className="text-foreground font-bold text-base lg:text-lg mb-2 lg:mb-3">Upload Screenshot</p>
                    <p className="text-xs lg:text-sm text-muted-foreground mb-4 lg:mb-6">
                      PNG, JPG, GIF up to 5MB - Drag & drop or click to browse
                    </p>
                    <Button type="button" variant="outline" className="rounded-xl px-6 lg:px-8 py-2 lg:py-3 border-2 font-semibold text-sm lg:text-base">
                      Choose File
                    </Button>
                  </div>
                )}
              </div>

              {/* Premium Tags Card - Responsive */}
              <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
                <label className="text-lg lg:text-xl font-bold text-foreground mb-4 lg:mb-6 flex items-center gap-3">
                  <Hash className="h-5 w-5 lg:h-6 lg:w-6 text-purple-500" />
                  Tags
                  <span className="text-xs lg:text-sm font-normal text-muted-foreground ml-2">
                    (Max 5 tags)
                  </span>
                </label>
                <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 mb-4 lg:mb-6">
                  <div className="flex-1 relative">
                    <Hash className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      placeholder="Add relevant tags..."
                      className="w-full pl-10 lg:pl-12 pr-4 py-3 lg:py-4 border-2 border-border/50 rounded-xl bg-background/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm lg:text-base"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={addTag}
                    disabled={!tagInput.trim() || formData.tags.length >= 5}
                    className="px-6 lg:px-8 py-3 lg:py-4 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 transition-all text-sm lg:text-base"
                  >
                    Add Tag
                  </Button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 lg:gap-3">
                    {formData.tags.map(tag => (
                      <div
                        key={tag}
                        className="group flex items-center gap-1 lg:gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 lg:px-4 py-2 lg:py-3 rounded-xl text-xs lg:text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                      >
                        <Hash className="h-3 w-3 lg:h-4 lg:w-4" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-red-200 text-sm lg:text-base font-bold ml-1 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/*  Error Messages */}
              {(error || aiError) && (
                <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border-2 border-red-500/20 text-red-600 px-4 lg:px-6 py-3 lg:py-5 rounded-xl backdrop-blur-sm shadow-lg">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <AlertTriangle className="h-4 w-4 lg:h-5 lg:w-5" />
                    <span className="font-semibold text-sm lg:text-base">{error || aiError}</span>
                  </div>
                </div>
              )}

              {/* Submit Buttons - Responsive */}
              <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 justify-end pt-4 lg:pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="px-6 lg:px-10 py-3 lg:py-4 rounded-xl border-2 font-semibold text-sm lg:text-lg hover:bg-accent transition-all order-2 lg:order-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.title.trim() || !formData.body.trim()}
                  className="px-8 lg:px-12 py-3 lg:py-4 rounded-xl font-semibold text-sm lg:text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl disabled:opacity-50 transition-all order-1 lg:order-2"
                >
                  {loading ? (
                    <div className="flex items-center gap-2 lg:gap-3">
                      <div className="animate-spin rounded-full h-4 w-4 lg:h-5 lg:w-5 border-2 border-white border-t-transparent"></div>
                      <span className="text-sm lg:text-base">Publishing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 lg:gap-3">
                      <Rocket className="h-4 w-4 lg:h-5 lg:w-5" />
                      <span className="text-sm lg:text-base">Publish Question</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/*  AI Assistant Sidebar - Responsive */}
          <div className="xl:col-span-2">
            <div className="sticky top-6 lg:top-8 space-y-6 lg:space-y-8">
              {/* AI Assistant Card */}
              <div className="bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl border-2 border-purple-500/20 p-6 lg:p-8 shadow-xl">
                <div className="flex items-center gap-3 lg:gap-4 mb-4 lg:mb-6">
                  <div className="relative">
                    <Bot className="h-8 w-8 lg:h-10 lg:w-10 text-purple-500" />
                    <div className="absolute -top-1 -right-1">
                      <Sparkles className="h-4 w-4 lg:h-5 lg:w-5 text-yellow-500 animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                      AI Assistant
                    </h3>
                    <p className="text-xs lg:text-sm text-muted-foreground">Powered by Gemini 2.5</p>
                  </div>
                </div>
                
                <div className="space-y-4 lg:space-y-6">
                  <div className="flex items-start gap-3 lg:gap-4 p-3 lg:p-4 bg-white/5 dark:bg-black/5 rounded-xl border border-purple-500/10">
                    <Wand2 className="h-4 w-4 lg:h-5 lg:w-5 text-purple-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground text-sm lg:text-base mb-1">Smart Title Enhancement</h4>
                      <p className="text-xs lg:text-sm text-muted-foreground">AI improves clarity and engagement</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 lg:gap-4 p-3 lg:p-4 bg-white/5 dark:bg-black/5 rounded-xl border border-blue-500/10">
                    <Sparkles className="h-4 w-4 lg:h-5 lg:w-5 text-blue-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground text-sm lg:text-base mb-1">Intelligent Tagging</h4>
                      <p className="text-xs lg:text-sm text-muted-foreground">Auto-suggests relevant tags</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 lg:gap-4 p-3 lg:p-4 bg-white/5 dark:bg-black/5 rounded-xl border border-green-500/10">
                    <Brain className="h-4 w-4 lg:h-5 lg:w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground text-sm lg:text-base mb-1">Quality Analysis</h4>
                      <p className="text-xs lg:text-sm text-muted-foreground">Real-time feedback and suggestions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 lg:gap-4 p-3 lg:p-4 bg-white/5 dark:bg-black/5 rounded-xl border border-amber-500/10">
                    <Zap className="h-4 w-4 lg:h-5 lg:w-5 text-amber-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground text-sm lg:text-base mb-1">Duplicate Detection</h4>
                      <p className="text-xs lg:text-sm text-muted-foreground">Avoid asking similar questions</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Best Practices Card */}
              <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 backdrop-blur-sm rounded-2xl border-2 border-amber-500/20 p-6 lg:p-8 shadow-xl">
                <h3 className="text-lg lg:text-xl font-bold text-foreground mb-4 lg:mb-6 flex items-center gap-2 lg:gap-3">
                  <Crown className="h-5 w-5 lg:h-6 lg:w-6 text-amber-500" />
                  Pro Tips
                </h3>
                <ul className="space-y-3 lg:space-y-4 text-xs lg:text-sm">
                  <li className="flex items-start gap-2 lg:gap-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 lg:mt-2 flex-shrink-0"></div>
                    <span className="text-foreground"><strong>Clear Problem Statement:</strong> Describe exactly what you're trying to achieve</span>
                  </li>
                  <li className="flex items-start gap-2 lg:gap-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 lg:mt-2 flex-shrink-0"></div>
                    <span className="text-foreground"><strong>Code Examples:</strong> Include relevant code snippets with proper formatting</span>
                  </li>
                  <li className="flex items-start gap-2 lg:gap-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 lg:mt-2 flex-shrink-0"></div>
                    <span className="text-foreground"><strong>Error Details:</strong> Share exact error messages and stack traces</span>
                  </li>
                  <li className="flex items-start gap-2 lg:gap-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 lg:mt-2 flex-shrink-0"></div>
                    <span className="text-foreground"><strong>Research First:</strong> Mention what you've already tried and searched for</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}