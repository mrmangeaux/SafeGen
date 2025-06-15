'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Search } from 'lucide-react'

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

interface CaseNote {
  id: string
  content: string
  createdAt: string
  createdBy: string
}

export default function CaseNotesPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [notes, setNotes] = useState<CaseNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchCases()
  }, [])

  useEffect(() => {
    if (selectedCase) {
      fetchNotes(selectedCase.id)
    }
  }, [selectedCase])

  const fetchCases = async () => {
    try {
      console.log('Fetching cases from API...')
      const response = await fetch('/api/cases')
      if (!response.ok) throw new Error('Failed to fetch cases')
      const data = await response.json()
      console.log('Raw API response:', data)
      
      // Transform the data to match our interface
      const transformedCases = data.map((case_: any) => {
        console.log('Processing case:', case_)
        return {
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
        }
      })
      console.log('Transformed cases:', transformedCases)
      setCases(transformedCases)
    } catch (error) {
      console.error('Error fetching cases:', error)
      toast({
        title: 'Error',
        description: 'Failed to load cases',
        variant: 'destructive'
      })
    }
  }

  const fetchNotes = async (caseId: string) => {
    try {
      console.log('Fetching notes for case:', caseId)
      const response = await fetch(`/api/cases/${caseId}/notes`)
      if (!response.ok) {
        console.error('Failed to fetch notes:', response.status, response.statusText)
        throw new Error('Failed to fetch notes')
      }
      const data = await response.json()
      console.log('Notes data:', data)
      setNotes(data)
    } catch (error) {
      console.error('Error fetching case notes:', error)
      toast({
        title: 'Error',
        description: 'Failed to load case notes',
        variant: 'destructive'
      })
    }
  }

  const handleAddNote = async () => {
    if (!selectedCase || !newNote.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/cases/${selectedCase.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newNote }),
      })

      if (!response.ok) throw new Error('Failed to add note')
      
      const addedNote = await response.json()
      setNotes([addedNote, ...notes])
      setNewNote('')
      
      toast({
        title: 'Success',
        description: 'Note added successfully',
      })
    } catch (error) {
      console.error('Error adding note:', error)
      toast({
        title: 'Error',
        description: 'Failed to add note',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCases = cases.filter(case_ => {
    const title = case_.title?.toLowerCase() || ''
    const description = case_.description?.toLowerCase() || ''
    const query = searchQuery.toLowerCase()
    return title.includes(query) || description.includes(query)
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Case Notes</h1>
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
                  className={`cursor-pointer transition-colors ${
                    selectedCase?.id === case_.id ? 'border-primary' : ''
                  }`}
                  onClick={() => setSelectedCase(case_)}
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedCase ? `Notes for ${selectedCase.caseNumber}` : 'Select a case to view notes'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedCase && (
              <>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-4">{selectedCase.description}</p>
                  <Textarea
                    placeholder="Add a new note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleAddNote}
                    disabled={isLoading || !newNote.trim()}
                  >
                    Add Note
                  </Button>
                </div>

                <div className="space-y-4">
                  {notes.map((note) => (
                    <Card key={note.id}>
                      <CardContent className="pt-6">
                        <p className="text-sm">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Added on {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 