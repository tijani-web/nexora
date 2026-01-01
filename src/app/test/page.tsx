// app/test/api-test.tsx
'use client'

import { useState } from 'react'
import { usersApi } from '@/lib/api'
import { Button } from '@/components/ui/button'

export default function ApiTest() {
  const [userId, setUserId] = useState('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testApi = async () => {
    if (!userId) return
    
    try {
      setLoading(true)
      
      const stats = await usersApi.getUserStats(userId)
      // console.log('📊 Stats response:', stats)
      
      const questions = await usersApi.getUserQuestions(userId)
      // console.log('❓ Questions response:', questions)
      
      const answers = await usersApi.getUserAnswers(userId)
      // console.log('💬 Answers response:', answers)
      
      setResults({
        stats,
        questions: questions?.length || 0,
        answers: answers?.length || 0
      })
      
    } catch (error) {
      console.error('❌ Test failed:', error)
    //   setResults({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">API Test</h1>
      
      <div className="mb-4">
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter User ID"
          className="border p-2 rounded w-full"
        />
      </div>
      
      <Button onClick={testApi} disabled={loading || !userId}>
        {loading ? 'Testing...' : 'Test API'}
      </Button>
      
      {results && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Results:</h2>
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}