import { SimulationFlow } from '@/components/simulation-flow'
import { getCosmosClient } from '@/lib/cosmos'
import { notFound } from 'next/navigation'

interface SimulationPageProps {
  params: {
    caseId: string
  }
}

export default async function SimulationPage({ params }: SimulationPageProps) {
  const { caseId } = params

  // Get case data to verify it exists
  const client = await getCosmosClient()
  const databaseId = process.env.NEXT_PUBLIC_COSMOS_DATABASE_ID
  if (!databaseId) throw new Error('Database ID not configured')

  const database = client.database(databaseId)
  const casesContainer = database.container('cases')

  const { resource: case_ } = await casesContainer.item(caseId).read()
  if (!case_) {
    notFound()
  }

  // For now, we'll use a hardcoded provider ID
  // In a real app, this would come from the authenticated user
  const providerId = 'provider1'

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Case Simulation</h1>
      <SimulationFlow 
        providerId={providerId}
        caseId={caseId}
        onComplete={(evaluation) => {
          console.log('Simulation completed:', evaluation)
        }}
      />
    </div>
  )
} 