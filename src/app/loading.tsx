// app/loading.tsx
import React from 'react'

const Loading = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 max-w-sm w-full">
        
        {/* Main Spinner */}
        <div className="relative">
          {/* Outer ring */}
          <div className="w-16 h-16 border-4 border-border/20 rounded-full"></div>
          {/* Animated spinner */}
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 border-r-blue-500 rounded-full animate-spin"></div>
        </div>

        {/* Text with fade animation */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground animate-pulse">
            Loading Nexora
          </h3>
          <p className="text-sm text-muted-foreground">
            Preparing your experience...
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  )
}

export default Loading