'use client'

import { Search, X, User, Tag, MessageSquare, Hash, Clock, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSearch } from '@/hooks/useSearch'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useDebounce } from '@/hooks/useDebounce'

// Filter types
type FilterType = 'all' | 'question' | 'answer' | 'user' | 'tag'

export function HeroSearch() {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const { results, counts, loading, error, search, clearResults } = useSearch()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce search to avoid too many API calls
  const debouncedQuery = useDebounce(query, 300)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nexora-recent-searches')
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5))
    }
  }, [])

  // Save to recent searches
  const saveToRecentSearches = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return
    
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('nexora-recent-searches', JSON.stringify(updated))
  }, [recentSearches])

  // Handle search with debouncing
  useEffect(() => {
    if (debouncedQuery.trim()) {
      search(debouncedQuery)
      setShowResults(true)
    } else {
      clearResults()
      setShowResults(false)
    }
  }, [debouncedQuery])

  // Filter results based on active filter
  const filteredResults = activeFilter === 'all' 
    ? results 
    : results.filter(result => result.type === activeFilter)

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showResults) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < filteredResults.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
          break
        case 'Enter':
          if (selectedIndex >= 0 && filteredResults[selectedIndex]) {
            const result = filteredResults[selectedIndex]
            window.location.href = getResultUrl(result)
            setShowResults(false)
          }
          break
        case 'Escape':
          setShowResults(false)
          setSelectedIndex(-1)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showResults, filteredResults, selectedIndex])

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    if (searchQuery.trim()) {
      setShowResults(true)
    }
  }

  const handleExampleClick = (example: string) => {
    setQuery(example)
    handleSearch(example)
    saveToRecentSearches(example)
  }

  const handleResultClick = (result: any) => {
    saveToRecentSearches(query)
    setShowResults(false)
    setSelectedIndex(-1)
  }

  const clearSearch = () => {
    setQuery('')
    clearResults()
    setShowResults(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  // Filter tabs with counts
  const filterTabs = [
    { key: 'all' as FilterType, label: 'All', count: results.length, icon: Hash },
    { key: 'question' as FilterType, label: 'Questions', count: counts.questions, icon: MessageSquare },
    { key: 'answer' as FilterType, label: 'Answers', count: counts.answers, icon: MessageSquare },
    { key: 'user' as FilterType, label: 'Users', count: counts.users, icon: User },
    { key: 'tag' as FilterType, label: 'Tags', count: counts.tags, icon: Tag },
  ]

  // Get result icon based on type
  const getResultIcon = (type: string) => {
    switch (type) {
      case 'question': return <MessageSquare className="h-4 w-4 text-blue-500" />
      case 'answer': return <MessageSquare className="h-4 w-4 text-green-500" />
      case 'user': return <User className="h-4 w-4 text-purple-500" />
      case 'tag': return <Tag className="h-4 w-4 text-orange-500" />
      default: return <Hash className="h-4 w-4 text-gray-500" />
    }
  }

  // Get result URL based on type
  const getResultUrl = (result: any) => {
    switch (result.type) {
      case 'question': return `/questions/${result.id}`
      case 'answer': return `/questions/${result.question_id}`
      case 'user': return `/profile/${result.id}`
      case 'tag': return `/tags/${result.tag_name}`
      default: return '#'
    }
  }

  // Highlight matching text in search results
  const highlightText = (text: string, highlight: string) => {
    if (!text || !highlight) return text
    
    const regex = new RegExp(`(${highlight})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark> : 
        part
    )
  }

  // Get display text for result
  const getResultDisplay = (result: any) => {
    switch (result.type) {
      case 'question': 
        return {
          title: result.title,
          subtitle: result.body,
          meta: `by ${result.author_name} • ${result.answers_count} answers • ${result.views_count} views`
        }
      case 'answer':
        return {
          title: `Answer: ${result.question_title}`,
          subtitle: result.body,
          meta: `by ${result.author_name}`
        }
      case 'user':
        return {
          title: result.username,
          subtitle: result.email,
          meta: `Member since ${new Date(result.created_at).toLocaleDateString()}`
        }
      case 'tag':
        return {
          title: result.tag_name,
          subtitle: `${result.question_count || 0} questions`,
          meta: `Popular tag`
        }
      default:
        return { title: 'Unknown', subtitle: '', meta: '' }
    }
  }

  return (
    <div className="text-center py-12 px-6 border-b border-border relative">
      <h1 className="text-4xl font-bold text-foreground mb-4">
        Ask, Learn, Share
      </h1>
      
      {/* Search Bar */}
      <div className="max-w-2xl mx-auto relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query.trim() && setShowResults(true)}
            placeholder="Search questions, answers, users, tags..."
            className="w-full pl-10 pr-10 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-foreground"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Search Results Dropdown */}
        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            {/* Filter Tabs */}
            {!loading && results.length > 0 && (
              <div className="flex border-b border-border">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveFilter(tab.key)
                      setSelectedIndex(-1)
                    }}
                    className={`flex items-center gap-1 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                      activeFilter === tab.key
                        ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <tab.icon className="h-3 w-3" />
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="bg-muted px-1 rounded text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            
            {/* Loading State */}
            {loading && (
              <div className="p-4 text-center text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  🔍 Searching...
                </div>
              </div>
            )}
            
            {/* Error State */}
            {error && (
              <div className="p-4 text-center text-destructive">
                ❌ {error}
              </div>
            )}
            
            {/* Results */}
            {!loading && !error && filteredResults.length > 0 && (
              <div className="py-2">
                {filteredResults.map((result, index) => {
                  const display = getResultDisplay(result)
                  const isSelected = index === selectedIndex
                  
                  return (
                    <Link
                      key={`${result.type}-${result.id}-${index}`}
                      href={getResultUrl(result)}
                      onClick={() => handleResultClick(result)}
                    >
                      <div className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-border last:border-b-0 transition-colors ${
                        isSelected ? 'bg-accent' : 'hover:bg-accent'
                      }`}>
                        <div className="mt-1">
                          {getResultIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-1">
                            {highlightText(display.title, query)}
                          </h3>
                          {display.subtitle && (
                            <p className="text-muted-foreground text-xs line-clamp-2 mb-1">
                              {highlightText(display.subtitle, query)}
                            </p>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {display.meta}
                          </div>
                        </div>
                        {isSelected && (
                          <ArrowUp className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
            
            {/* Empty States */}
            {!loading && !error && filteredResults.length === 0 && (
              <div className="p-6 text-center">
                {query ? (
                  // No results for query
                  <div className="text-muted-foreground">
                    <p className="mb-2">No {activeFilter !== 'all' ? activeFilter : ''} results found for "{query}"</p>
                    <p className="text-xs">Try different keywords or browse all content</p>
                  </div>
                ) : (
                  // Recent searches
                  recentSearches.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4" />
                        Recent Searches
                      </h4>
                      <div className="space-y-2">
                        {recentSearches.map((searchTerm, index) => (
                          <button
                            key={index}
                            onClick={() => handleExampleClick(searchTerm)}
                            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                          >
                            {searchTerm}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // No recent searches
                    <div className="text-muted-foreground">
                      <p>Start typing to search questions, answers, users, and tags</p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Example Searches */}
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {[
            "React hooks tutorial",
            "Python data analysis",
            "@username",
            "#javascript"
          ].map((example) => (
            <Button
              key={example}
              variant="outline"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => handleExampleClick(example)}
            >
              {example}
            </Button>
          ))}
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="text-xs text-muted-foreground mt-3 flex justify-center gap-4">
          <span>↑↓ Navigate</span>
          <span>Enter Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  )
}