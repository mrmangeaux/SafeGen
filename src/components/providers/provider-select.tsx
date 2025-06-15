import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

interface Provider {
  id: string
  name: string
  role: string
  status: string
  contact: {
    email: string
  }
}

interface ProviderSelectProps {
  onSelect: (provider: Provider) => void
}

export function ProviderSelect({ onSelect }: ProviderSelectProps) {
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const response = await fetch('/api/providers')
        if (!response.ok) throw new Error('Failed to load providers')
        const data = await response.json()
        setProviders(data)
      } catch (error) {
        console.error('Error loading providers:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadProviders()
  }, [])

  const handleProviderSelect = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId)
    if (provider) {
      onSelect(provider)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Select Provider</h3>
      <Select onValueChange={handleProviderSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Select a provider" />
        </SelectTrigger>
        <SelectContent>
          {providers.map((provider) => (
            <SelectItem key={provider.id} value={provider.id}>
              {provider.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 