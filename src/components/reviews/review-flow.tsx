import { useState } from 'react'
import { StepForm } from '@/components/ui/step-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { generateRecommendations } from '@/lib/vectorization'
import { useToast } from '@/components/ui/use-toast'
import { routes } from '@/lib/routes'

interface Provider {
  id: string
  name: string
  role: string
  status: string
  contact: {
    phone: string
    email: string
    address: string
  }
}

interface ReviewFlowProps {
  providers: Provider[]
  onComplete: (review: any) => void
  onCancel: () => void
}

export function ReviewFlow({ providers, onComplete, onCancel }: ReviewFlowProps) {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [context, setContext] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleProviderSelect = async (providerId: string) => {
    const provider = providers.find(p => p.id === providerId)
    if (!provider) return

    setSelectedProvider(provider)
    setIsLoading(true)
    setContext(null)
    setRecommendations([])

    try {
      // Fetch provider context
      const response = await fetch(routes.providers.context(providerId))
      if (!response.ok) throw new Error('Failed to fetch provider context')
      const providerContext = await response.json()

      if (!providerContext.cases || providerContext.cases.length === 0) {
        toast({
          title: 'No Cases Found',
          description: 'This provider has no cases to review',
          variant: 'destructive'
        })
        setIsLoading(false)
        return
      }

      // Generate recommendations based on all available context
      const recommendations = await generateRecommendations(provider.id, {
        documents: providerContext.documents || [],
        summary: JSON.stringify({
          provider: providerContext.provider,
          cases: providerContext.cases,
          reviews: providerContext.reviews,
          services: providerContext.services,
          tasks: providerContext.tasks,
          notes: providerContext.notes,
          communications: providerContext.communications,
          attachments: providerContext.attachments
        })
      })

      setContext(providerContext)
      setRecommendations(recommendations.recommendations)
    } catch (error) {
      console.error('Error loading provider context:', error)
      toast({
        title: 'Error',
        description: 'Failed to load provider context',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    {
      title: 'Select Provider',
      description: 'Choose a provider to review',
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
              {providers.map((provider) => (
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
      title: 'Review Context',
      description: 'Review the provider\'s history and performance',
      content: ({ formData }: any) => (
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading provider context...</p>
            </div>
          ) : context ? (
            <>
              <div className="space-y-4">
                <h3 className="font-medium">Provider Information</h3>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm"><strong>Role:</strong> {context.provider.role}</p>
                    <p className="text-sm"><strong>Status:</strong> {context.provider.status}</p>
                    <p className="text-sm"><strong>Contact:</strong> {context.provider.contact.email}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Case History</h3>
                {context.cases.map((case_: any) => (
                  <Card key={case_.id}>
                    <CardContent className="pt-6">
                      <h4 className="font-medium">{case_.name}</h4>
                      <p className="text-sm">{case_.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Status: {case_.status}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {context.services && context.services.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Services</h3>
                  {context.services.map((service: any) => (
                    <Card key={service.id}>
                      <CardContent className="pt-6">
                        <h4 className="font-medium">{service.name}</h4>
                        <p className="text-sm">{service.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Status: {service.status}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {context.tasks && context.tasks.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Tasks</h3>
                  {context.tasks.map((task: any) => (
                    <Card key={task.id}>
                      <CardContent className="pt-6">
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm">{task.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Status: {task.status}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {context.reviews && context.reviews.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Previous Reviews</h3>
                  {context.reviews.map((review: any) => (
                    <Card key={review.id}>
                      <CardContent className="pt-6">
                        <p className="text-sm">{review.assessment}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Date: {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {context.notes && context.notes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Notes</h3>
                  {context.notes.map((note: any) => (
                    <Card key={note.id}>
                      <CardContent className="pt-6">
                        <p className="text-sm">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Date: {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

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
              Please select a provider to view their context
            </p>
          )}
        </div>
      )
    },
    {
      title: 'Finalize Review',
      description: 'Add your final assessment and recommendations',
      content: ({ formData, updateFormData }: any) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Overall Assessment</label>
            <textarea
              className="w-full mt-1 p-2 border rounded-md"
              rows={4}
              value={formData.assessment || ''}
              onChange={(e) => updateFormData({ assessment: e.target.value })}
              placeholder="Provide your overall assessment of the provider's performance..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Key Strengths</label>
            <textarea
              className="w-full mt-1 p-2 border rounded-md"
              rows={3}
              value={formData.strengths || ''}
              onChange={(e) => updateFormData({ strengths: e.target.value })}
              placeholder="List the provider's key strengths..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Areas for Improvement</label>
            <textarea
              className="w-full mt-1 p-2 border rounded-md"
              rows={3}
              value={formData.improvements || ''}
              onChange={(e) => updateFormData({ improvements: e.target.value })}
              placeholder="List areas where the provider can improve..."
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