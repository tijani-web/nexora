'use client'

import { useEffect, useState } from 'react'
import { questionsApi } from '@/lib/api'

export function DebugQuestions() {
  const [status, setStatus] = useState('Testing...')
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const testApi = async () => {
      try {
        setStatus('Calling /api/questions...')
        const result = await questionsApi.getAll()
        setStatus(`✅ Success! Got ${result.length} questions`)
        setData(result)
      } catch (error: any) {
        setStatus(`❌ Error: ${error.message}`)
      }
    }

    testApi()
  }, [])

  return (
    <div className="p-4 border border-yellow-500 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
      <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">API Debug</h3>
      <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">{status}</p>
      {data && (
        <pre className="text-xs bg-white dark:bg-gray-800 p-2 rounded overflow-auto max-h-40">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}