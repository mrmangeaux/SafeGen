import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

interface CaseNote {
  id: string
  content: string
  createdAt: string
  createdBy: string
}

interface CaseNotesProps {
  caseId: string
}

export function CaseNotes({ caseId }: CaseNotesProps) {
  const [notes, setNotes] = useState<CaseNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchNotes()
  }, [caseId])

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/cases/${caseId}/notes`)
      if (!response.ok) throw new Error('Failed to fetch notes')
      const data = await response.json()
      setNotes(data)
    } catch (error) {
      console.error('Error fetching notes:', error)
      toast({
        title: 'Error',
        description: 'Failed to load case notes',
        variant: 'destructive'
      })
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/cases/${caseId}/notes`, {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
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
      </CardContent>
    </Card>
  )
} 