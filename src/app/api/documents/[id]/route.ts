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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    // Get the document first to ensure it exists
    const { resource: document } = await container.item(id).read()
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Delete the document
    await container.item(id).delete()

    return NextResponse.json({
      message: 'Document deleted successfully'
    })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
} 