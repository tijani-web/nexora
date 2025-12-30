// app/chat/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  Bot, 
  User, 
  Trash2, 
  Plus,
  Loader2,
  Sparkles,
  MessageCircle,
  X
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { chatApi } from '@/lib/api'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStartingNew, setIsStartingNew] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const response = await chatApi.getConversations()
      if (response.success) {
        setConversations(response.data)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await chatApi.getConversation(conversationId)
      if (response.success) {
        setCurrentConversation(response.data)
        setMessages(response.data.messages || [])
      }
      setShowMobileSidebar(false)
    } catch (error) {
      console.error('Failed to load conversation:', error)
      toast.error('Failed to load conversation')
    }
  }

  const startNewConversation = async () => {
    if (!user) {
      toast.error('Please log in to start a conversation')
      return
    }

    setIsStartingNew(true)
    try {
      const response = await chatApi.startConversation()
      if (response.success) {
        const newConversation = response.data
        setConversations(prev => [newConversation, ...prev])
        setCurrentConversation(newConversation)
        setMessages([])
        setShowMobileSidebar(false)
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
      toast.error('Failed to start conversation')
    } finally {
      setIsStartingNew(false)
    }
  }

  const deleteConversation = async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    try {
      const response = await chatApi.deleteConversation(conversationId)
      if (response.success) {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId))
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(null)
          setMessages([])
        }
        toast.success('Conversation deleted')
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      toast.error('Failed to delete conversation')
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || !user) return

    const messageContent = inputMessage.trim()
    setInputMessage('')
    
    let conversationId = currentConversation?.id

    // If no current conversation, create one
    if (!conversationId) {
      try {
        const response = await chatApi.startConversation()
        if (response.success) {
          const newConversation = response.data
          setConversations(prev => [newConversation, ...prev])
          setCurrentConversation(newConversation)
          conversationId = newConversation.id
        } else {
          throw new Error('Failed to create conversation')
        }
      } catch (error) {
        console.error('Failed to create conversation:', error)
        toast.error('Failed to create conversation')
        return
      }
    }

    // Add user message to UI immediately
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageContent,
      created_at: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await chatApi.sendMessage(conversationId!, messageContent)
      if (response.success) {
        // Update with actual AI response
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: response.data.response,
          created_at: new Date().toISOString()
        }
        
        setMessages(prev => [...prev.filter(msg => msg.id !== userMessage.id), aiMessage])
        
        // Reload conversations to update titles
        loadConversations()
      } else {
        throw new Error(response.message || 'Failed to send message')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message')
      // Remove the temporary message if failed
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
    } finally {
      setIsLoading(false)
    }
  }

  // Simple Markdown Renderer without SyntaxHighlighter
  const MarkdownRenderer = ({ content }: { content: string }) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            
            if (language) {
              return (
                <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg my-2 overflow-x-auto">
                  <code className={`language-${language}`} {...props}>
                    {children}
                  </code>
                </pre>
              )
            }
            
            return (
              <code className="bg-gray-700 text-gray-100 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            )
          },
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
          li: ({ children }) => <li className="ml-4">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
          h1: ({ children }) => <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mt-3 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-bold mt-3 mb-2">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-500 pl-4 my-2 italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Conversations Sidebar */}
      <div className={`
        w-80 border-r border-border bg-card flex flex-col
        lg:static fixed inset-y-0 left-0 z-40 transform transition-transform duration-200
        ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:z-auto
      `}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Chat History</h2>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setShowMobileSidebar(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 border-b border-border">
          <Button
            onClick={startNewConversation}
            disabled={isStartingNew}
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isStartingNew ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            New Chat
          </Button>
        </div>

        {/* Sidebar Scroll Area with Dark Scrollbar */}
        <div className="flex-1 overflow-y-auto p-4 
          scrollbar-thin 
          scrollbar-thumb-gray-600 
          scrollbar-track-gray-800 
          hover:scrollbar-thumb-gray-500 
          dark:scrollbar-thumb-gray-600 
          dark:scrollbar-track-gray-900
          scrollbar-track-rounded-full 
          scrollbar-thumb-rounded-full">
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => loadConversation(conversation.id)}
                className={`
                  p-3 rounded-lg cursor-pointer transition-all group
                  ${currentConversation?.id === conversation.id 
                    ? 'bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-800' 
                    : 'hover:bg-accent border border-transparent'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <p className="text-sm font-medium text-foreground truncate">
                        {conversation.title}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => deleteConversation(conversation.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {conversations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start a new chat to begin!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="border-b border-border p-4 bg-card">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setShowMobileSidebar(true)}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
            
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-white" />
            </div>
            
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-foreground truncate">Nexa AI Assistant</h1>
              <p className="text-sm text-muted-foreground truncate">
                {currentConversation 
                  ? `Chat started ${new Date(currentConversation.created_at).toLocaleDateString()}`
                  : 'Start a new conversation'
                }
              </p>
            </div>
            
            <Badge variant="secondary" className="flex-shrink-0">
              <Sparkles className="h-3 w-3 mr-1" />
              AI
            </Badge>
          </div>
        </div>

        {/* Messages Area with Dark Scrollbar */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 
          scrollbar-thin 
          scrollbar-thumb-gray-600 
          scrollbar-track-gray-800 
          hover:scrollbar-thumb-gray-500 
          dark:scrollbar-thumb-gray-600 
          dark:scrollbar-track-gray-900
          scrollbar-track-rounded-full 
          scrollbar-thumb-rounded-full">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-8 lg:py-12">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-2">
                  Welcome to Nexa AI!
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm lg:text-base">
                  I'm here to help you with questions, code reviews, and anything related to the Nexora platform.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                  <Card 
                    className="cursor-pointer hover:bg-accent transition-colors" 
                    onClick={() => setInputMessage("How do I ask a good question?")}
                  >
                    <CardContent className="p-3 text-sm">
                      💡 How to ask good questions
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => setInputMessage("Can you review this code?")}
                  >
                    <CardContent className="p-3 text-sm">
                      🔍 Code review help
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => setInputMessage("What are the platform features?")}
                  >
                    <CardContent className="p-3 text-sm">
                      📚 Platform guide
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => setInputMessage("Help me format my answer")}
                  >
                    <CardContent className="p-3 text-sm">
                      ✨ Answer formatting
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 lg:gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {message.role === 'user' ? (
                      <>
                        <AvatarImage src={user?.avatar_url} />
                        <AvatarFallback className="bg-blue-600 text-white text-xs">
                          {user?.username[0].toUpperCase()}
                        </AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className={`flex-1 max-w-full lg:max-w-3xl ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block px-3 lg:px-4 py-2 lg:py-3 rounded-2xl ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-accent border border-border rounded-bl-none'
                    }`}>
                      <div className="text-sm">
                        {message.role === 'user' ? (
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        ) : (
                          <MarkdownRenderer content={message.content} />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 lg:mt-2">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex gap-3 lg:gap-4">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="inline-block px-3 lg:px-4 py-2 lg:py-3 rounded-2xl bg-accent border border-border rounded-bl-none">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Nexa is thinking...
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-card">
          <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask Nexa anything about questions, answers, code, or the platform..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={!inputMessage.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center hidden sm:block">
              Nexa can help with question formatting, code reviews, and platform guidance
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}