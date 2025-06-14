'use client'

// Temporarily disabled auth for testing
// import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  // return <SessionProvider>{children}</SessionProvider>
  return <>{children}</>
} 