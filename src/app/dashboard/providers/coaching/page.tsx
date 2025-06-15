'use client'

import { useState, useEffect } from 'react'
import { getContextForCase, generateRecommendations } from '@/lib/vectorization'
import {
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  PlayIcon,
  StopIcon,
  ChartBarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

interface CoachingContext {
  documents: any[]
  summary: string
}

interface Recommendation {
  id?: string
  type: 'approach' | 'resource' | 'warning' | 'rubric_evaluation'
  title: string
  description: string
  confidence: number
  source: string
}

interface Scenario {
  id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  context: string
  expectedOutcomes: string[]
}

interface CaseAnalysis {
  caseId: string
  childInfo: {
    age: number
    needs: string[]
    challenges: string[]
  }
  caregiverInfo: {
    type: string
    strengths: string[]
    challenges: string[]
  }
  successfulOutcomes: {
    caseId: string
    similarity: number
    keyFactors: string[]
  }[]
  recommendations: Recommendation[]
}

export default function CoachingPage() {
  const [selectedCase, setSelectedCase] = useState<string>('')
  const [context, setContext] = useState<CoachingContext | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null)
  const [caseAnalysis, setCaseAnalysis] = useState<CaseAnalysis | null>(null)
  const { toast } = useToast()

  // Mock data - replace with actual data fetching
  const mockCases = [
    { id: 'case1', name: 'Johnson Family Case' },
    { id: 'case2', name: 'Smith Family Case' },
    { id: 'case3', name: 'Williams Family Case' },
  ]

  const mockScenarios: Scenario[] = [
    {
      id: '1',
      title: 'Initial Family Meeting',
      description: 'Practice conducting an initial meeting with a new family case.',
      difficulty: 'beginner',
      context: 'The family has recently been referred to your services. They seem hesitant to engage.',
      expectedOutcomes: [
        'Establish rapport with family members',
        'Identify immediate concerns',
        'Set initial goals',
      ],
    },
    {
      id: '2',
      title: 'Addressing Resistance',
      description: 'Handle a situation where the family is resistant to recommended services.',
      difficulty: 'intermediate',
      context: 'The family has missed several appointments and is not following through with recommendations.',
      expectedOutcomes: [
        'Identify barriers to engagement',
        'Develop alternative approaches',
        'Build trust and rapport',
      ],
    },
  ]

  const handleCaseSelect = async (caseId: string) => {
    setIsLoading(true)
    setSelectedCase(caseId)
    try {
      // Get context for the selected case
      const context = await getContextForCase(caseId, 'Current coaching needs and challenges')
      setContext(context)

      // Get case analysis
      const analysis = await analyzeCase(caseId, context)
      setCaseAnalysis(analysis)

      // Generate recommendations based on analysis
      const recommendations = await generateRecommendations(caseId, {
        documents: context.documents,
        summary: context.summary
      })
      
      // Add IDs to recommendations
      const recommendationsWithIds = recommendations.recommendations.map(rec => ({
        ...rec,
        id: crypto.randomUUID()
      }))
      setRecommendations(recommendationsWithIds)
    } catch (error) {
      console.error('Error loading case context:', error)
      toast({
        title: 'Error',
        description: 'Failed to load case context',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeCase = async (caseId: string, context: CoachingContext): Promise<CaseAnalysis> => {
    try {
      // Get case details
      const response = await fetch(`/api/cases/${caseId}`)
      if (!response.ok) throw new Error('Failed to fetch case details')
      const caseDetails = await response.json()

      // Get similar successful cases
      const similarCases = await fetch(`/api/cases/similar?caseId=${caseId}&outcome=successful`)
        .then(res => res.json())

      // Generate recommendations based on successful cases
      const recommendations = await generateRecommendations(caseId, {
        documents: context.documents,
        summary: `Analyzing case ${caseId} with context: ${context.summary}`
      })

      // Add IDs to recommendations
      const recommendationsWithIds = recommendations.recommendations.map(rec => ({
        ...rec,
        id: crypto.randomUUID()
      }))

      return {
        caseId,
        childInfo: {
          age: caseDetails.childAge,
          needs: caseDetails.childNeeds,
          challenges: caseDetails.childChallenges
        },
        caregiverInfo: {
          type: caseDetails.caregiverType,
          strengths: caseDetails.caregiverStrengths,
          challenges: caseDetails.caregiverChallenges
        },
        successfulOutcomes: similarCases.map((c: any) => ({
          caseId: c.id,
          similarity: c.similarity,
          keyFactors: c.keyFactors
        })),
        recommendations: recommendationsWithIds
      }
    } catch (error) {
      console.error('Error analyzing case:', error)
      throw error
    }
  }

  const startSimulation = (scenario: Scenario) => {
    setCurrentScenario(scenario)
    setIsSimulating(true)
  }

  const stopSimulation = () => {
    setIsSimulating(false)
    setCurrentScenario(null)
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Provider Coaching</h1>
          <p className="mt-2 text-sm text-gray-700">
            Get AI-powered coaching and recommendations based on case analysis and successful outcomes.
          </p>
        </div>
      </div>

      {/* Case Selection */}
      <div className="mt-8">
        <label htmlFor="case-select" className="block text-sm font-medium text-gray-700">
          Select Case
        </label>
        <select
          id="case-select"
          value={selectedCase}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleCaseSelect(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
        >
          <option value="">Select a case...</option>
          {mockCases.map((case_) => (
            <option key={case_.id} value={case_.id}>
              {case_.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="mt-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Loading case analysis...</p>
        </div>
      ) : (
        selectedCase && caseAnalysis && (
          <div className="mt-8 space-y-8">
            {/* Case Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Case Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Child Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Child Information</h3>
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm font-medium">Age:</span>
                        <p className="text-sm text-gray-600">{caseAnalysis.childInfo.age} years</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Needs:</span>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {caseAnalysis.childInfo.needs.map((need, index) => (
                            <li key={index}>{need}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Challenges:</span>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {caseAnalysis.childInfo.challenges.map((challenge, index) => (
                            <li key={index}>{challenge}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Caregiver Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Caregiver Information</h3>
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm font-medium">Type:</span>
                        <p className="text-sm text-gray-600">{caseAnalysis.caregiverInfo.type}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Strengths:</span>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {caseAnalysis.caregiverInfo.strengths.map((strength, index) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Challenges:</span>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {caseAnalysis.caregiverInfo.challenges.map((challenge, index) => (
                            <li key={index}>{challenge}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Similar Successful Cases */}
            <Card>
              <CardHeader>
                <CardTitle>Similar Successful Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {caseAnalysis.successfulOutcomes.map((outcome) => (
                    <div key={outcome.caseId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-medium">Case {outcome.caseId}</h4>
                          <p className="text-sm text-gray-500">
                            Similarity: {Math.round(outcome.similarity * 100)}%
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-sm font-medium">Key Factors:</span>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {outcome.keyFactors.map((factor, index) => (
                            <li key={index}>{factor}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className={`rounded-lg p-4 ${
                        rec.type === 'warning'
                          ? 'bg-red-50'
                          : rec.type === 'resource'
                          ? 'bg-blue-50'
                          : 'bg-green-50'
                      }`}
                    >
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <LightBulbIcon className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-gray-900">{rec.title}</h4>
                          <p className="mt-1 text-sm text-gray-500">{rec.description}</p>
                          <div className="mt-2 text-xs text-gray-400">
                            Confidence: {Math.round(rec.confidence * 100)}% | Source: {rec.source}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )
      )}
    </div>
  )
} 