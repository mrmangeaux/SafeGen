import { NextResponse } from 'next/server'
import { getCosmosClient } from '@/lib/cosmos'
import { v4 as uuidv4 } from 'uuid'

// GET /api/rubrics - Get all rubrics
export async function GET() {
  try {
    console.log('Fetching rubrics...')
    const client = await getCosmosClient()
    const databaseId = process.env.NEXT_PUBLIC_COSMOS_DATABASE_ID
    
    if (!databaseId) {
      throw new Error('NEXT_PUBLIC_COSMOS_DATABASE_ID is not set')
    }

    console.log('Connecting to database:', databaseId)
    const database = client.database(databaseId)
    const container = database.container('rubrics')
    console.log('Reading rubrics from container...')
    const { resources: rubrics } = await container.items.readAll().fetchAll()
    console.log('Found rubrics:', rubrics.length)

    return NextResponse.json(rubrics)
  } catch (error) {
    console.error('Error fetching rubrics:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// POST /api/rubrics - Create a new rubric
export async function POST(request: Request) {
  try {
    console.log('Creating new rubric...')
    const body = await request.json()
    console.log('Request body:', body)
    const { name, content } = body
    if (!name || !content) {
      console.log('Missing required fields:', { name: !!name, content: !!content })
      return new NextResponse('Name and content are required', { status: 400 })
    }

    const client = await getCosmosClient()
    const databaseId = process.env.NEXT_PUBLIC_COSMOS_DATABASE_ID
    
    if (!databaseId) {
      throw new Error('NEXT_PUBLIC_COSMOS_DATABASE_ID is not set')
    }

    console.log('Connecting to database:', databaseId)
    const database = client.database(databaseId)
    const container = database.container('rubrics')
    const rubric = {
      id: uuidv4(),
      name,
      content,
      createdAt: new Date().toISOString()
    }
    console.log('Creating rubric:', rubric)

    const { resource } = await container.items.create(rubric)
    console.log('Rubric created successfully:', resource)
    return NextResponse.json(resource)
  } catch (error) {
    console.error('Error creating rubric:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 