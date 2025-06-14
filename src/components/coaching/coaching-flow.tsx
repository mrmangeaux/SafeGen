import { useState } from 'react'
import { StepForm } from '@/components/ui/step-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { getContextForCase, generateRecommendations } from '@/lib/vectorization'
import { useToast } from '@/components/ui/use-toast'

interface Case {
  id: string
  name: string
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
}

interface CoachingFlowProps {
  cases: Case[]
  onComplete: (coaching: any) => void
  onCancel: () => void
}

export function CoachingFlow({ cases, onComplete, onCancel }: CoachingFlowProps) {
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [context, setContext] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleCaseSelect = async (caseId: string) => {
    const case_ = cases.find(c => c.id === caseId)
    if (!case_) return

    setSelectedCase(case_)
    setIsLoading(true)

    try {
      // Get context for the case
      const context = await getContextForCase(caseId, 'Current coaching needs and challenges')
      setContext(context)

      // Generate recommendations
      const recommendations = await generateRecommendations(caseId, {
        documents: context.documents,
        summary: context.summary
      })

      setRecommendations(recommendations.recommendations)
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

  const steps = [
    {
      title: 'Select Case',
      description: 'Choose a case to coach on',
      content: ({ formData, updateFormData }: any) => (
        <div className="space-y-4">
          <Select
            value={formData.caseId}
            onValueChange={(value) => {
              updateFormData({ caseId: value })
              handleCaseSelect(value)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a case" />
            </SelectTrigger>
            <SelectContent>
              {cases.map((case_) => (
                <SelectItem key={case_.id} value={case_.id}>
                  {case_.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    },
    {
      title: 'Case Analysis',
      description: 'Review case details and AI recommendations',
      content: ({ formData }: any) => (
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading case analysis...</p>
            </div>
          ) : selectedCase && context ? (
            <>
              <div className="space-y-4">
                <h3 className="font-medium">Child Information</h3>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Age:</span> {selectedCase.childInfo.age} years
                      </p>
                      <div>
                        <p className="font-medium text-sm">Needs:</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {selectedCase.childInfo.needs.map((need, index) => (
                            <li key={index}>{need}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Challenges:</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {selectedCase.childInfo.challenges.map((challenge, index) => (
                            <li key={index}>{challenge}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Caregiver Information</h3>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Type:</span> {selectedCase.caregiverInfo.type}
                      </p>
                      <div>
                        <p className="font-medium text-sm">Strengths:</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {selectedCase.caregiverInfo.strengths.map((strength, index) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Challenges:</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {selectedCase.caregiverInfo.challenges.map((challenge, index) => (
                            <li key={index}>{challenge}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">AI Recommendations</h3>
                {recommendations.map((rec, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <h4 className="font-medium">{rec.title}</h4>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Confidence: {Math.round(rec.confidence * 100)}%
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground">
              Please select a case to view its analysis
            </p>
          )}
        </div>
      )
    },
    {
      title: 'Coaching Plan',
      description: 'Create a coaching plan based on the analysis',
      content: ({ formData, updateFormData }: any) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Coaching Goals</label>
            <textarea
              className="w-full mt-1 p-2 border rounded-md"
              rows={4}
              value={formData.goals || ''}
              onChange={(e) => updateFormData({ goals: e.target.value })}
              placeholder="List the specific goals for this coaching session..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Action Items</label>
            <textarea
              className="w-full mt-1 p-2 border rounded-md"
              rows={4}
              value={formData.actions || ''}
              onChange={(e) => updateFormData({ actions: e.target.value })}
              placeholder="List specific action items for the provider..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Resources Needed</label>
            <textarea
              className="w-full mt-1 p-2 border rounded-md"
              rows={3}
              value={formData.resources || ''}
              onChange={(e) => updateFormData({ resources: e.target.value })}
              placeholder="List any resources or support needed..."
            />
          </div>
        </div>
      )
    }
  ]

  return (
    <StepForm
      steps={steps}
      onComplete={onComplete}
      onCancel={onCancel}
    />
  )
} 