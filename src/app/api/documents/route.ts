import { NextResponse } from 'next/server'
import { CosmosClient } from '@azure/cosmos'

// Initialize Cosmos DB client
const endpoint = process.env.COSMOS_ENDPOINT
const key = process.env.COSMOS_KEY
const databaseId = process.env.COSMOS_DATABASE_ID
const containerId = process.env.COSMOS_CONTAINER_ID

if (!endpoint || !key || !databaseId || !containerId) {
  throw new Error('Missing required Cosmos DB configuration')
}

const client = new CosmosClient({ endpoint, key })
const container = client.database(databaseId).container(containerId)

export async function GET() {
  try {
    const querySpec = {
      query: 'SELECT * FROM c ORDER BY c.uploadedAt DESC'
    }

    const { resources: documents } = await container.items.query(querySpec).fetchAll()

    // Remove the content field from the response to reduce payload size
    const sanitizedDocuments = documents.map(({ content, ...doc }) => doc)

    return NextResponse.json(sanitizedDocuments)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
} 