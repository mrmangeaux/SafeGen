import { NextResponse } from 'next/server'
import { getCosmosClient } from '@/lib/cosmos'

export async function POST(request: Request) {
  try {
    const coaching = await request.json()
    console.log('Saving coaching session:', coaching)

    const client = await getCosmosClient()
    const databaseId = process.env.NEXT_PUBLIC_COSMOS_DATABASE_ID
    
    if (!databaseId) {
      throw new Error('NEXT_PUBLIC_COSMOS_DATABASE_ID is not set')
    }

    const database = client.database(databaseId)
    const coachingContainer = database.container('coaching-sessions')

    // Generate a unique ID for the coaching session
    const id = `cs${Date.now()}`
    
    const coachingData = {
      id,
      ...coaching,
      createdAt: new Date().toISOString(),
      type: 'coaching_session'
    }

    const { resource } = await coachingContainer.items.upsert(coachingData)
    
    return NextResponse.json(resource)
  } catch (error) {
    console.error('Error creating coaching session:', error)
    return NextResponse.json(
      { error: 'Failed to create coaching session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const client = await getCosmosClient()
    const databaseId = process.env.NEXT_PUBLIC_COSMOS_DATABASE_ID
    
    if (!databaseId) {
      throw new Error('NEXT_PUBLIC_COSMOS_DATABASE_ID is not set')
    }

    const database = client.database(databaseId)
    const coachingContainer = database.container('coaching-sessions')

    const { resources } = await coachingContainer.items
      .query('SELECT * FROM c ORDER BY c.createdAt DESC')
      .fetchAll()
    
    return NextResponse.json(resources)
  } catch (error) {
    console.error('Error fetching coaching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coaching sessions' },
      { status: 500 }
    )
  }
} 