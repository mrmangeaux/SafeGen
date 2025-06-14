'use client'

import { useState } from 'react'
import { CosmosClient } from '@azure/cosmos'
import { getContextForCase, generateRecommendations } from '@/lib/vectorization'

// Initialize Cosmos DB client
const endpoint = process.env.NEXT_PUBLIC_COSMOS_ENDPOINT
const key = process.env.NEXT_PUBLIC_COSMOS_KEY
const databaseId = process.env.NEXT_PUBLIC_COSMOS_DATABASE_ID

if (!endpoint || !key || !databaseId) {
  throw new Error('Missing required Cosmos DB configuration')
}

const client = new CosmosClient({ endpoint, key })
const casesContainer = client.database(databaseId).container('cases')

interface Provider {
  id: string
  providerName: string
  title: string
  department: string
}

interface VectorizedDocument {
  id: string
  content: string
  embedding: number[]
  metadata: {
    type: string
    caseId?: string
    providerId?: string
    timestamp: string
    category?: string
    tags?: string[]
  }
}

interface Context {
  documents: VectorizedDocument[]
  summary: string
}

interface Recommendation {
  type: 'approach' | 'resource' | 'warning'
  title: string
  description: string
  confidence: number
  source: string
}

export default function ReviewFlow() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [context, setContext] = useState<Context | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNext = async () => {
    if (currentStep === 0) {
      // Provider selection step
      if (!selectedProvider) {
        setError('Please select a provider to review')
        return
      }
      setCurrentStep(1)
    } else if (currentStep === 1) {
      // Context gathering step
      if (!selectedProvider) {
        setError('Please select a provider to review')
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        // Get provider's recent cases
        const { resources: cases } = await casesContainer.items
          .query({
            query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(c.services.providers, @providerId)',
            parameters: [{ name: '@providerId', value: selectedProvider.id }],
          })
          .fetchAll()

        if (cases.length === 0) {
          setError('No cases found for this provider')
          setIsLoading(false)
          return
        }

        // Get context for the most recent case
        const mostRecentCase = cases[0]
        const context = await getContextForCase(mostRecentCase.id, 'provider performance review')
        setContext(context)
        setCurrentStep(2)
      } catch (error) {
        console.error('Error getting context:', error)
        setError('Failed to get case context')
      } finally {
        setIsLoading(false)
      }
    } else if (currentStep === 2) {
      // Recommendations step
      if (!context) {
        setError('Missing case context')
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        const result = await generateRecommendations(context.documents[0].metadata.caseId!, context)
        setRecommendations(result.recommendations)
        setCurrentStep(3)
      } catch (error) {
        console.error('Error generating recommendations:', error)
        setError('Failed to generate recommendations')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1)
    setError(null)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Provider Review</h1>
        <div className="flex items-center space-x-2">
          {[0, 1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-2 w-24 rounded-full ${
                step <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {currentStep === 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Select Provider</h2>
              {/* Provider selection UI */}
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Gathering Context</h2>
              {/* Context gathering UI */}
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Review Recommendations</h2>
              {/* Recommendations UI */}
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Review Complete</h2>
              {/* Review completion UI */}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        {currentStep > 0 && (
          <button
            onClick={handleBack}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
        )}
        {currentStep < 3 && (
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
} 