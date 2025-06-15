'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Upload, FileText } from 'lucide-react'

interface Rubric {
  id: string
  name: string
  content: string
  createdAt: string
}

export default function RubricsPage() {
  const [rubrics, setRubrics] = useState<Rubric[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newRubricName, setNewRubricName] = useState('')
  const [newRubricContent, setNewRubricContent] = useState('')
  const { toast } = useToast()

  // Load saved rubrics on component mount
  useEffect(() => {
    const loadRubrics = async () => {
      try {
        const response = await fetch('/api/rubrics')
        if (!response.ok) throw new Error('Failed to load rubrics')
        const data = await response.json()
        setRubrics(data)
      } catch (error) {
        console.error('Error loading rubrics:', error)
        toast({
          title: 'Error',
          description: 'Failed to load saved rubrics',
          variant: 'destructive',
        })
      }
    }
    loadRubrics()
  }, [toast])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const content = await file.text()
      setNewRubricContent(content)
      setNewRubricName(file.name.replace('.txt', ''))
    } catch (error) {
      console.error('Error reading file:', error)
      toast({
        title: 'Error',
        description: 'Failed to read rubric file',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveRubric = async () => {
    if (!newRubricName || !newRubricContent) {
      toast({
        title: 'Error',
        description: 'Please provide both a name and content for the rubric',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/rubrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newRubricName,
          content: newRubricContent,
        }),
      })

      if (!response.ok) throw new Error('Failed to save rubric')
      
      const savedRubric = await response.json()
      setRubrics([...rubrics, savedRubric])
      setNewRubricName('')
      setNewRubricContent('')
      
      toast({
        title: 'Success',
        description: 'Rubric saved successfully',
      })
    } catch (error) {
      console.error('Error saving rubric:', error)
      toast({
        title: 'Error',
        description: 'Failed to save rubric',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Rubrics</h1>
      
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload New Rubric</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
                id="rubric-file"
              />
              <label htmlFor="rubric-file">
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Rubric File
                  </span>
                </Button>
              </label>
            </div>

            <Input
              placeholder="Rubric Name"
              value={newRubricName}
              onChange={(e) => setNewRubricName(e.target.value)}
            />
            <Textarea
              placeholder="Paste your rubric content here..."
              value={newRubricContent}
              onChange={(e) => setNewRubricContent(e.target.value)}
              rows={10}
            />
            <Button 
              onClick={handleSaveRubric}
              disabled={isLoading || !newRubricName || !newRubricContent}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Rubric'
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Saved Rubrics</h2>
          <div className="space-y-4">
            {rubrics.map((rubric) => (
              <Card key={rubric.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <h4 className="font-medium">{rubric.name}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Created: {new Date(rubric.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-4 p-4 bg-muted rounded-md">
                    <pre className="text-sm whitespace-pre-wrap">{rubric.content}</pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 