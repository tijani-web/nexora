// app/layout.tsx - UPDATED
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/components/ui/toast-provider'
import { AuthWrapper } from '@/components/AuthWrapper'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Nexora - AI-Powered Knowledge Hub',
  description: 'Connect, learn, and share insights with AI-enhanced discussions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Set theme immediately to prevent flash
                  var savedTheme = localStorage.getItem('nexora-theme') || 'dark';
                  document.documentElement.classList.add(savedTheme);
                  
                  // Set auth state to prevent flash
                  var token = localStorage.getItem('token');
                  var user = localStorage.getItem('user');
                  if (token && user) {
                    document.documentElement.setAttribute('data-auth', 'true');
                  } else {
                    document.documentElement.setAttribute('data-auth', 'false');
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            <AuthWrapper>
            <ToastProvider />
             {children}
            </AuthWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}