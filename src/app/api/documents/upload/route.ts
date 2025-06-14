import { NextResponse } from 'next/server'
import { CosmosClient } from '@azure/cosmos'
import { v4 as uuidv4 } from 'uuid'

// Initialize Cosmos DB client
const endpoint = process.env.COSMOS_ENDPOINT
const key = process.env.COSMOS_KEY
const databaseId = process.env.COSMOS_DATABASE_ID
const containerId = process.env.COSMOS_CONTAINER_ID

if (!endpoint || !key || !databaseId || !containerId) {
  throw new Error('Missing required Cosmos DB configuration')
}

const client = new CosmosClient({ endpoint, key })
const container = client.database(databaseId).container("Documents-1")

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const metadata = JSON.parse(formData.get('metadata') as string)

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // For text files, store the actual text content
    let textContent = null
    if (file.type.startsWith('text/')) {
      textContent = buffer.toString('utf-8')
    }

    // Create document with RAG-friendly metadata
    const document = {
      id: uuidv4(),
      name: file.name,
      type: file.type,
      size: file.size,
      content: buffer.toString('base64'), // Keep base64 for binary files
      textContent, // Add decoded text content for text files
      uploadedAt: new Date().toISOString(),
      metadata: {
        ...metadata,
        // Add additional RAG-friendly metadata
        contentType: file.type,
        lastModified: file.lastModified,
        isTextFile: file.type.startsWith('text/'),
        // You can add more metadata here based on your RAG requirements
        // For example: extracted text, keywords, entities, etc.
      }
    }

    // Store in Cosmos DB
    await container.items.create(document)

    return NextResponse.json({
      message: 'File uploaded successfully',
      documentId: document.id
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
} 