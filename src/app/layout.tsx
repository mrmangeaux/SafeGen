import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import NavigationIcons from '@/components/NavigationIcons'
import { ToastProvider } from '@/components/ui/toast-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SafeGen',
  description: 'Child Welfare Case Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <NavigationIcons />
          <div className="pt-16">
            {children}
          </div>
        </div>
        <ToastProvider />
      </body>
    </html>
  )
} 