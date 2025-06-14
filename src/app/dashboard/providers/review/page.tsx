'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Search } from 'lucide-react'
import { getContextForCase, generateRecommendations } from '@/lib/vectorization'

interface ProviderReview {
  id: string
  providerId: string
  providerName: string
  reviewDate: string
  performanceScore: number
  strengths: string[]
  areasForImprovement: string[]
  recommendations: string[]
  context: string
  caseHistory: {
    caseId: string
    caseType: string
    startDate: string
    endDate: string
    outcome: string
    keyInterventions: string[]
    challenges: string[]
    lessonsLearned: string[]
  }[]
  rubricScores: {
    category: string
    score: number
    evidence: string[]
  }[]
}

export default function ProviderReviewPage() {
  const [reviews, setReviews] = useState<ProviderReview[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  const handleSearch = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/providers/review/search?query=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) throw new Error('Failed to fetch provider reviews')
      const data = await response.json()
      setReviews(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch provider reviews',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const generateReview = async (providerId: string) => {
    setLoading(true)
    try {
      // Get provider's case history
      const response = await fetch(`/api/providers/${providerId}/cases`)
      if (!response.ok) throw new Error('Failed to fetch provider cases')
      const cases = await response.json()

      // Get context for each case
      const caseContexts = await Promise.all(
        cases.map(async (case_: any) => {
          const context = await getContextForCase(case_.id, 'Provider performance and outcomes')
          return {
            caseId: case_.id,
            context: context.summary,
            documents: context.documents
          }
        })
      )

      // Generate recommendations based on case contexts
      const recommendations = await generateRecommendations(providerId, {
        documents: caseContexts.flatMap(c => c.documents),
        summary: caseContexts.map(c => c.context).join('\n')
      })

      // Calculate rubric scores based on case outcomes and interventions
      const rubricScores = calculateRubricScores(cases, caseContexts)

      // Create review object
      const review: ProviderReview = {
        id: crypto.randomUUID(),
        providerId,
        providerName: cases[0]?.providerName || 'Unknown Provider',
        reviewDate: new Date().toISOString(),
        performanceScore: calculateOverallScore(rubricScores),
        strengths: extractStrengths(caseContexts, recommendations),
        areasForImprovement: extractAreasForImprovement(caseContexts, recommendations),
        recommendations: recommendations.recommendations.map(r => r.description),
        context: caseContexts.map(c => c.context).join('\n\n'),
        caseHistory: cases,
        rubricScores
      }

      // Save review
      await fetch('/api/providers/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
      })

      setReviews(prev => [review, ...prev])
      toast({
        title: 'Success',
        description: 'Provider review generated successfully'
      })
    } catch (error) {
      console.error('Error generating review:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate provider review',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateRubricScores = (cases: any[], contexts: any[]) => {
    const rubric = [
      { category: 'Case Management', weight: 0.3 },
      { category: 'Client Engagement', weight: 0.25 },
      { category: 'Documentation', weight: 0.2 },
      { category: 'Resource Utilization', weight: 0.15 },
      { category: 'Outcome Achievement', weight: 0.1 }
    ]

    return rubric.map(category => {
      const evidence = contexts
        .filter(c => c.context.toLowerCase().includes(category.category.toLowerCase()))
        .map(c => c.context)

      const score = calculateCategoryScore(category.category, cases, evidence)
      return {
        category: category.category,
        score,
        evidence
      }
    })
  }

  const calculateCategoryScore = (category: string, cases: any[], evidence: string[]) => {
    // Implement scoring logic based on category
    // This is a simplified example - you would want more sophisticated scoring
    const baseScore = 0.7 // Base score for all categories
    const evidenceBonus = evidence.length * 0.05 // Bonus for having evidence
    const outcomeBonus = cases.filter(c => c.outcome === 'successful').length * 0.1 // Bonus for successful outcomes
    
    return Math.min(1, baseScore + evidenceBonus + outcomeBonus)
  }

  const calculateOverallScore = (rubricScores: any[]) => {
    return rubricScores.reduce((total, score) => total + score.score, 0) / rubricScores.length
  }

  const extractStrengths = (contexts: any[], recommendations: any) => {
    // Extract strengths from contexts and recommendations
    const strengths = new Set<string>()
    
    contexts.forEach(context => {
      if (context.context.toLowerCase().includes('success') || 
          context.context.toLowerCase().includes('effective')) {
        strengths.add(context.context)
      }
    })

    recommendations.recommendations
      .filter(r => r.type === 'approach' && r.confidence > 0.8)
      .forEach(r => strengths.add(r.description))

    return Array.from(strengths)
  }

  const extractAreasForImprovement = (contexts: any[], recommendations: any) => {
    // Extract areas for improvement from contexts and recommendations
    const areas = new Set<string>()
    
    contexts.forEach(context => {
      if (context.context.toLowerCase().includes('challenge') || 
          context.context.toLowerCase().includes('difficulty')) {
        areas.add(context.context)
      }
    })

    recommendations.recommendations
      .filter(r => r.type === 'warning' || (r.type === 'approach' && r.confidence < 0.6))
      .forEach(r => areas.add(r.description))

    return Array.from(areas)
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Provider Reviews</h1>
          <p className="mt-2 text-sm text-gray-700">
            AI-powered performance reviews based on case history and outcomes.
          </p>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search provider reviews..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Search
        </Button>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardHeader>
              <CardTitle>{review.providerName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Review Date</Label>
                  <p>{new Date(review.reviewDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Performance Score</Label>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${review.performanceScore * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-2">{Math.round(review.performanceScore * 100)}%</span>
                  </div>
                </div>
                <div>
                  <Label>Rubric Scores</Label>
                  <div className="space-y-2">
                    {review.rubricScores.map((score, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm">
                          <span>{score.category}</span>
                          <span>{Math.round(score.score * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${score.score * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Strengths</Label>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {review.strengths.map((strength, index) => (
                      <li key={index}>{strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <Label>Areas for Improvement</Label>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {review.areasForImprovement.map((area, index) => (
                      <li key={index}>{area}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <Label>Recommendations</Label>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {review.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <Label>Context</Label>
                  <p className="text-sm text-gray-600">{review.context}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 