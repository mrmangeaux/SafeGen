import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'

interface Rubric {
  id: string
  name: string
  content: string
}

interface RubricUploadProps {
  onRubricSelect: (rubric: Rubric) => void
  selectedRubricId?: string
}

export function RubricUpload({ onRubricSelect, selectedRubricId }: RubricUploadProps) {
  const [rubrics, setRubrics] = useState<Rubric[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchRubrics = async () => {
      try {
        const response = await fetch('/api/rubrics')
        if (!response.ok) throw new Error('Failed to fetch rubrics')
        const data = await response.json()
        setRubrics(data)
      } catch (error) {
        console.error('Error fetching rubrics:', error)
        toast({
          title: 'Error',
          description: 'Failed to load rubrics',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchRubrics()
  }, [toast])

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading rubrics...</div>
  }

  return (
    <Select
      value={selectedRubricId}
      onValueChange={(value) => {
        const rubric = rubrics.find(r => r.id === value)
        if (rubric) {
          onRubricSelect(rubric)
        }
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a rubric" />
      </SelectTrigger>
      <SelectContent>
        {rubrics.map((rubric) => (
          <SelectItem key={rubric.id} value={rubric.id}>
            {rubric.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 