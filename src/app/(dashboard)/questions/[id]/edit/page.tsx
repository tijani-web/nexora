// app/questions/[id]/edit/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Hash, Image, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { questionsApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

export default function EditQuestionPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    tags: [] as string[],
    image_url: '' as string | null
  })
  
  const [tagInput, setTagInput] = useState('')

  const questionId = params.id as string
// In your edit page - FIX THE OWNERSHIP CHECK
useEffect(() => {
  const fetchQuestion = async () => {
    try {
      setFetching(true)
      const question = await questionsApi.getById(questionId)
      
      // ✅ FIX: Check ownership using author_id (not user_id)
      if (question.author_id !== user?.id) {
        setError('You can only edit your own questions')
        return
      }

      setFormData({
        title: question.title,
        body: question.body || '',
        tags: question.tags || [],
        image_url: question.image_url
      })
    } catch (err: any) {
      setError('Failed to load question')
      console.error('Fetch error:', err)
    } finally {
      setFetching(false)
    }
  }

  if (user) {
    fetchQuestion()
  }
}, [questionId, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError(null)

      await questionsApi.update(questionId, {
        title: formData.title.trim(),
        body: formData.body.trim(),
        tags: formData.tags
      })

      router.push(`/questions/${questionId}`)
      
    } catch (err: any) {
      console.error('Update error:', err)
      setError(err.message || 'Failed to update question')
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

  if (fetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-destructive">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10 hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Question</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-card rounded-xl border border-border p-6">
            <label className="block text-lg font-semibold text-foreground mb-4">
              Question Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-4 text-lg border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={150}
              required
            />
          </div>

          {/* Description */}
          <div className="bg-card rounded-xl border border-border p-6">
            <label className="block text-lg font-semibold text-foreground mb-4">
              Detailed Description
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
              rows={12}
              className="w-full p-4 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              required
            />
          </div>

          {/* Tags */}
          <div className="bg-card rounded-xl border border-border p-6">
            <label className="block text-lg font-semibold text-foreground mb-4">
              Tags
            </label>
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Add tags (max 5)"
                  className="w-full pl-10 pr-3 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button
                type="button"
                onClick={addTag}
                disabled={!tagInput.trim() || formData.tags.length >= 5}
                className="px-6"
              >
                Add Tag
              </Button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <div
                    key={tag}
                    className="flex items-center gap-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-2 rounded-full text-sm font-medium"
                  >
                    <Hash className="h-3 w-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-blue-600 text-base font-bold ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="px-8"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              disabled={loading || !formData.title.trim() || !formData.body.trim()}
            >
              {loading ? 'Updating...' : 'Update Question'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}