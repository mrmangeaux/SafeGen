'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  ClipboardDocumentListIcon, 
  ClipboardDocumentCheckIcon, 
  AcademicCapIcon,
  PencilIcon,
  PlayIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

export default function NavigationIcons() {
  const pathname = usePathname()

  const navItems = [
    {
      name: 'Cases & Notes',
      href: '/cases/notes',
      icon: ClipboardDocumentListIcon,
      description: 'View and manage cases and notes'
    },
    {
      name: 'Reviews',
      href: '/reviews/new',
      icon: ClipboardDocumentCheckIcon,
      description: 'Access and manage reviews'
    },
    {
        name: 'Rubrics',
        href: '/rubrics',
        icon: PencilIcon,
        description: 'Access and manage reviews'
      },
    {
      name: 'Coaching',
      href: '/coaching/new',
      icon: AcademicCapIcon,
      description: 'View coaching sessions and resources'
    },
    {
      name: 'Simulation',
      href: '/cases/simulation',
      icon: PlayIcon,
      description: 'Run case simulations and scenarios'
    },
    {
      name: 'Chat',
      href: '/chat',
      icon: ChatBubbleLeftRightIcon,
      description: 'Chat with mentor'
    },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              {/* Logo could go here */}
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-2" aria-hidden="true" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="space-y-1 pb-3 pt-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${
                  isActive
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <item.icon className="h-5 w-5 mr-2" aria-hidden="true" />
                  {item.name}
                </div>
                <p className="ml-7 text-sm text-gray-500">{item.description}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
} 