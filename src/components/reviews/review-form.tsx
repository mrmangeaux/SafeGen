import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

interface Provider {
  id: string
  name: string
  role: string
  status: string
  contact: {
    email: string
  }
}

interface Rubric {
  id: string
  name: string
  content: string
}

interface ReviewFormProps {
  provider: Provider
  context: any
  recommendations: any[]
  rubric: Rubric | null
  onComplete: (data: any) => void
}

export function ReviewForm({ provider, context, recommendations, rubric, onComplete }: ReviewFormProps) {
  const [assessment, setAssessment] = useState('')
  const [implementationPlan, setImplementationPlan] = useState('')
  const [feedbackImprovement, setFeedbackImprovement] = useState('')
  const [rubricEvaluation, setRubricEvaluation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!assessment) {
      toast({
        title: 'Error',
        description: 'Please provide an overall assessment',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const review = {
        providerId: provider.id,
        providerName: provider.name,
        assessment,
        implementationPlan,
        feedbackImprovement,
        rubricId: rubric?.id,
        rubricName: rubric?.name,
        rubricContent: rubric?.content,
        rubricEvaluation,
        recommendations: recommendations.map(rec => ({
          title: rec.title,
          description: rec.description,
        })),
        context: {
          cases: context?.cases || [],
          services: context?.services || [],
          tasks: context?.tasks || [],
          notes: context?.notes || []
        }
      }

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(review),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to save review')
      }

      const savedReview = await response.json()
      onComplete(savedReview)
    } catch (error) {
      console.error('Error saving review:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save review',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Overall Assessment</label>
            <Textarea
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              placeholder="Provide your overall assessment of the provider's performance..."
              rows={4}
            />
          </div>

          {rubric && (
            <div>
              <label className="text-sm font-medium">Rubric Evaluation</label>
              <Textarea
                value={rubricEvaluation}
                onChange={(e) => setRubricEvaluation(e.target.value)}
                placeholder="Evaluate the provider based on the selected rubric..."
                rows={6}
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium">How do you plan to implement this feedback?</label>
            <Textarea
              value={implementationPlan}
              onChange={(e) => setImplementationPlan(e.target.value)}
              placeholder="Describe your plan for implementing the feedback and recommendations..."
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium">What would make this feedback better?</label>
            <Textarea
              value={feedbackImprovement}
              onChange={(e) => setFeedbackImprovement(e.target.value)}
              placeholder="Share your thoughts on how this feedback process could be improved..."
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !assessment}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 