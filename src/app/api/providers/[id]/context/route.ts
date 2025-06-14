import { NextResponse } from 'next/server'
import { getCosmosClient } from '@/lib/cosmos'
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../../../../../../.env.local') });

// import { CosmosClient } from '@azure/cosmos';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Provider ID:', params.id)
    const client = await getCosmosClient()
    const databaseId = process.env.NEXT_PUBLIC_COSMOS_DATABASE_ID
    console.log('Using database ID:', databaseId)
    
    if (!databaseId) {
      throw new Error('NEXT_PUBLIC_COSMOS_DATABASE_ID is not set')
    }

    const database = client.database(databaseId)
    console.log('Database connected')

    const providersContainer = database.container('providers')
    console.log('Providers container accessed')

    // Get provider details
    console.log('Attempting to read provider:', params.id)
    const { resource: provider } = await providersContainer.item(params.id).read()
    console.log('Provider found:', provider)

    if (!provider) {
      console.log('Provider not found')
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    const casesContainer = database.container('cases')
    const reviewsContainer = database.container('provider-reviews')
    const documentsContainer = database.container('Documents-1')

    // Get all cases where this provider is involved
    console.log('Fetching cases for provider')
    const { resources: cases } = await casesContainer.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE ARRAY_CONTAINS(c.services.providers, @providerId)
          OR ARRAY_CONTAINS(c.assignedTo, @providerId)
          OR c.assignedProviderId = @providerId
          OR c.primaryProviderId = @providerId
          OR c.assignedWorker.id = @providerId
        `,
        parameters: [{ name: '@providerId', value: params.id }]
      })
      .fetchAll()
    console.log('Cases found:', cases.length)

    // Get all reviews for this provider
    console.log('Fetching reviews for provider')
    const { resources: reviews } = await reviewsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.providerId = @providerId',
        parameters: [{ name: '@providerId', value: params.id }]
      })
      .fetchAll()
    console.log('Reviews found:', reviews.length)

    // Get all documents related to this provider's cases
    console.log('Fetching documents for provider')
    const caseIds = cases.map((c: any) => c.id)
    const { resources: documents } = await documentsContainer.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE ARRAY_CONTAINS(@caseIds, c.caseId)
          OR c.providerId = @providerId
          OR ARRAY_CONTAINS(c.assignedTo, @providerId)
        `,
        parameters: [
          { name: '@caseIds', value: caseIds },
          { name: '@providerId', value: params.id }
        ]
      })
      .fetchAll()
    console.log('Documents found:', documents.length)

    const response = {
      provider,
      cases,
      reviews,
      documents
    }
    console.log('Sending response:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching provider context:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    return NextResponse.json(
      { error: 'Failed to fetch provider context', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 