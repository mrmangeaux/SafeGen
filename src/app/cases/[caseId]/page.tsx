import { getCosmosClient } from '@/lib/cosmos'

export default async function CaseDetailsPage({ params }: { params: { caseId: string } }) {
  const client = await getCosmosClient()
  const databaseId = process.env.NEXT_PUBLIC_COSMOS_DATABASE_ID
  if (!databaseId) throw new Error('Database ID not configured')

  const database = client.database(databaseId)
  const casesContainer = database.container('cases')

  // Get current case data
  const { resource: currentCase } = await casesContainer.item(params.caseId).read()

  if (!currentCase) {
    return <div>Case not found</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        {/* Existing case details content */}
      </div>
    </div>
  )
} 