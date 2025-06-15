'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Search } from 'lucide-react'
import { SimulationFlow } from '@/components/simulation-flow'

interface Case {
  id: string
  name: string
  title: string
  caseNumber: string
  description: string
  status: string
  createdAt: string
  assignedTo: string[]
  priority: string
  lastUpdated: string
}

export default function CaseSimulationPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchCases()
  }, [])

  const fetchCases = async () => {
    try {
      const response = await fetch('/api/cases')
      if (!response.ok) throw new Error('Failed to fetch cases')
      const data = await response.json()
      const transformedCases = data.map((case_: any) => ({
        id: case_.id,
        name: case_.title,
        title: case_.title,
        caseNumber: case_.caseNumber || `CASE-${case_.id.slice(0, 8)}`,
        description: case_.description || 'No description available',
        status: case_.status,
        createdAt: case_.createdAt || case_.lastUpdated,
        assignedTo: case_.assignedTo || [],
        priority: case_.priority || 'medium',
        lastUpdated: case_.lastUpdated
      }))
      setCases(transformedCases)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load cases',
        variant: 'destructive'
      })
    }
  }

  const filteredCases = cases.filter(case_ => {
    const title = case_.title?.toLowerCase() || ''
    const description = case_.description?.toLowerCase() || ''
    const query = searchQuery.toLowerCase()
    return title.includes(query) || description.includes(query)
  })

  // For now, use a hardcoded provider ID (replace with auth in real app)
  const providerId = 'provider1'

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Case Simulation</h1>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cases List */}
        <Card>
          <CardHeader>
            <CardTitle>Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredCases.map((case_) => (
                <Card
                  key={case_.id}
                  className={`transition-colors ${selectedCase?.id === case_.id ? 'border-primary' : ''}`}
                >
                  <CardContent className="pt-6">
                    <h3 className="font-medium">{case_.title}</h3>
                    <p className="text-sm text-muted-foreground break-all">Case #{case_.caseNumber}</p>
                    <div className="text-xs text-muted-foreground mt-2 space-y-1">
                      <p>Status: {case_.status}</p>
                      {case_.assignedTo && case_.assignedTo.length > 0 && (
                        <p className="text-xs">
                          <span className="font-medium">Assigned to:</span> {case_.assignedTo.join(', ')}
                        </p>
                      )}
                    </div>
                    <Button 
                      className="mt-4 w-full"
                      onClick={() => setSelectedCase(case_)}
                      variant={selectedCase?.id === case_.id ? 'default' : 'outline'}
                    >
                      Simulate
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Simulation Section */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedCase ? `Simulation for ${selectedCase.caseNumber}` : 'Select a case to simulate'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedCase && (
              <SimulationFlow 
                providerId={providerId}
                caseId={selectedCase.id}
                onComplete={(evaluation) => {
                  // Optionally handle completion
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 