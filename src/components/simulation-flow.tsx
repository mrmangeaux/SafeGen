import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

interface SimulationFlowProps {
  providerId: string
  caseId: string
  onComplete?: (evaluation: any) => void
}

export function SimulationFlow({ providerId, caseId, onComplete }: SimulationFlowProps) {
  const [scenario, setScenario] = useState<any>(null)
  const [response, setResponse] = useState('')
  const [evaluation, setEvaluation] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateScenario = async () => {
    try {
      setLoading(true)
      setError(null)
      setScenario(null)
      setResponse('')
      setEvaluation(null)

      const res = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          caseId,
          action: 'generate'
        })
      })

      if (!res.ok) {
        throw new Error('Failed to generate scenario')
      }

      const data = await res.json()
      setScenario(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate scenario')
    } finally {
      setLoading(false)
    }
  }

  const evaluateResponse = async () => {
    if (!scenario || !response.trim()) return

    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          caseId,
          action: 'evaluate',
          scenario: scenario.scenario,
          response,
          expectedElements: scenario.expectedElements
        })
      })

      if (!res.ok) {
        throw new Error('Failed to evaluate response')
      }

      const data = await res.json()
      setEvaluation(data)
      onComplete?.(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate response')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {!scenario && !loading && (
        <Button 
          onClick={generateScenario}
          className="w-full"
        >
          Start Simulation
        </Button>
      )}

      {loading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {scenario && !evaluation && (
        <Card>
          <CardHeader>
            <CardTitle>Scenario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">{scenario.scenario}</p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Response</label>
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Type your response here..."
                className="min-h-[200px]"
              />
            </div>

            <Button 
              onClick={evaluateResponse}
              disabled={!response.trim() || loading}
              className="w-full"
            >
              Submit Response
            </Button>
          </CardContent>
        </Card>
      )}

      {evaluation && (
        <Card>
          <CardHeader>
            <CardTitle>Evaluation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Score</span>
              <span className="text-2xl font-bold">{evaluation.score}%</span>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Feedback</h3>
              <p>{evaluation.feedback}</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Strengths</h3>
              <ul className="list-disc pl-4">
                {evaluation.strengths.map((strength: string, i: number) => (
                  <li key={i}>{strength}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Areas for Improvement</h3>
              <ul className="list-disc pl-4">
                {evaluation.areasForImprovement.map((area: string, i: number) => (
                  <li key={i}>{area}</li>
                ))}
              </ul>
            </div>

            {evaluation.missingElements.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Missing Elements</h3>
                <ul className="list-disc pl-4">
                  {evaluation.missingElements.map((element: string, i: number) => (
                    <li key={i}>{element}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button 
              onClick={generateScenario}
              className="w-full"
            >
              Try Another Scenario
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 