import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'

interface Review {
  id: string
  rating: number
  comment: string
  createdAt: string
  rubricId?: string
  rubricEvaluation?: string
  rubric?: {
    name: string
    content: string
  }
}

interface ReviewListProps {
  reviews: Review[]
}

export function ReviewList({ reviews }: ReviewListProps) {
  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Review
                <Badge variant="secondary" className="ml-2">
                  {review.rating}/5
                </Badge>
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{review.comment}</p>
            
            {review.rubric && (
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <h4 className="font-medium">Rubric Evaluation: {review.rubric.name}</h4>
                </div>
                <div className="rounded-md bg-muted p-4">
                  <pre className="text-sm whitespace-pre-wrap">{review.rubricEvaluation}</pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 