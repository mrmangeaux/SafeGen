import { NextResponse } from 'next/server'
// import { CosmosClient } from '@azure/cosmos'
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local

config({ path: resolve(__dirname, '../../../.env.local') });

import { CosmosClient } from '@azure/cosmos';

// Initialize Cosmos DB client
console.log("process.env")
console.log(process.env)
const endpoint = process.env.NEXT_PUBLIC_COSMOS_ENDPOINT
const key = process.env.NEXT_PUBLIC_COSMOS_KEY
const databaseId = process.env.NEXT_PUBLIC_COSMOS_DATABASE_ID
const containerId = process.env.NEXT_PUBLIC_COSMOS_CONTAINER_ID
console.log(endpoint, key, databaseId, containerId)

if (!endpoint || !key || !databaseId) {
  throw new Error('Missing required Cosmos DB configuration')
}

const client = new CosmosClient({ endpoint, key })
const container = client.database(databaseId).container("Documents-1")

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