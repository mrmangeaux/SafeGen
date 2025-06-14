'use client'

import { useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useToast } from './use-toast'

export function Toast() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-0 right-0 p-4 space-y-4 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg p-4 shadow-lg ${
            toast.variant === 'destructive'
              ? 'bg-red-50 text-red-800'
              : 'bg-white text-gray-900'
          }`}
        >
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="text-sm font-medium">{toast.title}</h3>
              <p className="mt-1 text-sm">{toast.description}</p>
            </div>
            <button
              type="button"
              className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-500"
              onClick={() => removeToast(toast.id)}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
} 