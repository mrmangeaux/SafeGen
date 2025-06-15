import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { RubricUpload } from '@/components/coaching/rubric-upload'

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1),
  rubricId: z.string().optional(),
  rubricEvaluation: z.string().optional(),
})

type ReviewFormValues = z.infer<typeof reviewSchema>

interface ReviewFormProps {
  providerId: string
  onComplete: () => void
  onCancel: () => void
}

export function ReviewForm({ providerId, onComplete, onCancel }: ReviewFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRubric, setSelectedRubric] = useState<any>(null)
  const { toast } = useToast()

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: '',
      rubricId: '',
      rubricEvaluation: '',
    },
  })

  const onSubmit = async (data: ReviewFormValues) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/providers/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          providerId,
          rubricId: selectedRubric?.id,
          rubricEvaluation: data.rubricEvaluation,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit review')
      }

      toast({
        title: 'Success',
        description: 'Review submitted successfully',
      })
      onComplete()
    } catch (error) {
      console.error('Error submitting review:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit review',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comment</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h3 className="font-medium">Select Rubric (Optional)</h3>
          <RubricUpload
            onRubricSelect={(rubric) => {
              setSelectedRubric(rubric)
              form.setValue('rubricId', rubric.id)
            }}
            selectedRubricId={selectedRubric?.id}
          />
        </div>

        {selectedRubric && (
          <FormField
            control={form.control}
            name="rubricEvaluation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rubric Evaluation</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Evaluate the provider based on the selected rubric..."
                    rows={6}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </form>
    </Form>
  )
} 