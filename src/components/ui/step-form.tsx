import { useState } from 'react'
import { Button } from './button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './card'
import { Progress } from './progress'

export interface Step {
  title: string
  description: string
  content: ((props: { formData: any; updateFormData: (data: any) => void }) => JSX.Element) | JSX.Element
}

interface StepFormProps {
  steps: Step[]
  onComplete: (data: any) => void
  onCancel: () => void
}

export function StepForm({ steps, onComplete, onCancel }: StepFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})

  const progress = ((currentStep + 1) / steps.length) * 100

  const updateFormData = (data: any) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      onComplete(formData)
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }

  const currentStepData = steps[currentStep]

  return (
    <div className="max-w-2xl mx-auto">
      <Progress value={progress} className="mb-8" />
      
      <Card>
        <CardHeader>
          <CardTitle>{currentStepData.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
        </CardHeader>
        <CardContent>
          {typeof currentStepData.content === 'function' 
            ? currentStepData.content({ formData, updateFormData })
            : currentStepData.content}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 0 ? onCancel : handleBack}
          >
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          <Button onClick={handleNext}>
            {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 