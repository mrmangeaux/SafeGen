import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StepForm } from '@/components/ui/step-form'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

interface CoachingFlowProps {
  onComplete: (coaching: any) => void
  onCancel: () => void
}

export function CoachingFlow({ onComplete, onCancel }: CoachingFlowProps) {
  const [providers, setProviders] = useState<any[]>([])
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [context, setContext] = useState<any>(null)
  const [selectedCases, setSelectedCases] = useState<string[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/providers')
        if (!response.ok) {
          throw new Error('Failed to fetch providers')
        }
        const data = await response.json()
        setProviders(data)
      } catch (error) {
        console.error('Error fetching providers:', error)
        toast({
          title: 'Error',
          description: 'Failed to load providers',
          variant: 'destructive',
        })
      }
    }

    fetchProviders()
  }, [toast])

  const handleProviderSelect = async (providerId: string) => {
    const provider = providers.find(p => p.id === providerId)
    if (!provider) return

    setSelectedProvider(provider)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/providers/${providerId}/context`)
      if (!response.ok) {
        throw new Error('Failed to fetch provider context')
      }

      const data = await response.json()
      setContext(data)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCaseSelect = async () => {
    if (selectedCases.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one case',
        variant: 'destructive',
      })
      return
    }

    console.log('Starting recommendation generation...')
    console.log('Selected cases:', selectedCases)
    console.log('Provider context:', context)

    setIsLoading(true)
    try {
      // Generate recommendations based on selected cases
      console.log('Sending request to /api/coaching/recommendations')
      const recommendationsResponse = await fetch('/api/coaching/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: context.provider,
          cases: context.cases,
          selectedCaseIds: selectedCases,
          services: context.services,
          tasks: context.tasks,
          notes: context.notes,
          reviews: context.reviews
        }),
      })

      console.log('Recommendations response status:', recommendationsResponse.status)
      
      if (!recommendationsResponse.ok) {
        const errorData = await recommendationsResponse.json()
        console.error('Recommendations API error:', errorData)
        throw new Error(errorData.message || 'Failed to generate recommendations')
      }

      const recommendationsData = await recommendationsResponse.json()
      console.log('Received recommendations:', recommendationsData)
      setRecommendations(recommendationsData)
      
      // Move to the next step after recommendations are generated
      setCurrentStep(2)
    } catch (error) {
      console.error('Error generating recommendations:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: 'Select Provider',
      description: 'Choose a provider to coach',
      content: ({ formData, updateFormData }: any) => (
        <div className="space-y-4">
          <Select
            value={formData.providerId}
            onValueChange={(value) => {
              updateFormData({ providerId: value })
              handleProviderSelect(value)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent>
              {providers?.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    },
    {
      title: 'Select Cases',
      description: 'Choose specific cases to focus on',
      content: ({ formData, updateFormData }: any) => (
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2 text-sm text-muted-foreground">Loading provider context...</p>
            </div>
          ) : context ? (
            <>
              <div className="space-y-4">
                <h3 className="font-medium">Select Cases to Review</h3>
                <div className="space-y-4">
                  {context.cases.map((case_: any, index: number) => (
                    <Card key={case_.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start space-x-4">
                          <Checkbox
                            id={case_.id}
                            checked={selectedCases.includes(case_.id)}
                            onCheckedChange={(checked: boolean) => {
                              if (checked) {
                                setSelectedCases([...selectedCases, case_.id])
                              } else {
                                setSelectedCases(selectedCases.filter(id => id !== case_.id))
                              }
                            }}
                          />
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">Case #{index + 1}</h4>
                              <span className="text-xs text-muted-foreground">(ID: {case_.id})</span>
                            </div>
                            <p className="text-sm">{case_.name}</p>
                            <p className="text-sm text-muted-foreground">{case_.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Status: {case_.status}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleCaseSelect}
                disabled={selectedCases.length === 0 || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Recommendations...
                  </>
                ) : (
                  'Generate Recommendations'
                )}
              </Button>
            </>
          ) : (
            <p className="text-center text-muted-foreground">
              Please select a provider to view their cases
            </p>
          )}
        </div>
      )
    },
    {
      title: 'Actionable Next Steps',
      description: 'Review and customize the recommended next steps',
      content: ({ formData, updateFormData }: any) => (
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2 text-sm text-muted-foreground">Generating recommendations...</p>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-medium">Recommended Next Steps</h3>
              {recommendations.map((rec, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <h4 className="font-medium">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                    <div className="mt-4">
                      <label className="text-sm font-medium">Implementation Notes</label>
                      <textarea
                        className="w-full mt-1 p-2 border rounded-md"
                        rows={2}
                        value={formData[`implementation_${index}`] || ''}
                        onChange={(e) => updateFormData({ [`implementation_${index}`]: e.target.value })}
                        placeholder="Add your notes on how to implement this step..."
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              No recommendations generated yet. Please select cases and click "Generate Recommendations".
            </p>
          )}

          <div>
            <label className="text-sm font-medium">Additional Notes</label>
            <textarea
              className="w-full mt-1 p-2 border rounded-md"
              rows={4}
              value={formData.additionalNotes || ''}
              onChange={(e) => updateFormData({ additionalNotes: e.target.value })}
              placeholder="Add any additional notes or context for the coaching session..."
            />
          </div>
        </div>
      )
    }
  ]

  const handleComplete = async (formData: any) => {
    if (!selectedProvider) return

    const coaching = {
      providerId: selectedProvider.id,
      providerName: selectedProvider.name,
      caseIds: selectedCases,
      recommendations: recommendations.map((rec, index) => ({
        ...rec,
        implementationNotes: formData[`implementation_${index}`] || ''
      })),
      additionalNotes: formData.additionalNotes,
      context: {
        cases: context?.cases.filter((c: any) => selectedCases.includes(c.id)) || [],
        services: context?.services || [],
        tasks: context?.tasks || [],
        notes: context?.notes || []
      }
    }

    console.log('Submitting coaching:', coaching)

    try {
      const response = await fetch('/api/coaching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(coaching),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to save coaching')
      }

      const savedCoaching = await response.json()
      console.log('Coaching saved successfully:', savedCoaching)
      onComplete(savedCoaching)
    } catch (error) {
      console.error('Error saving coaching:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save coaching',
        variant: 'destructive',
      })
    }
  }

  return (
    <StepForm
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onComplete={handleComplete}
      onCancel={onCancel}
    />
  )
} 