import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CosmosClient } from '@azure/cosmos'

const endpoint = process.env.COSMOS_ENDPOINT!
const key = process.env.COSMOS_KEY!
const databaseId = process.env.COSMOS_DATABASE!
const containerId = 'rubrics'

const client = new CosmosClient({ endpoint, key })
const container = client.database(databaseId).container(containerId)

// GET /api/coaching/rubrics - Get all rubrics
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { resources: rubrics } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC',
        parameters: [{ name: '@userId', value: session.user.id }],
      })
      .fetchAll()

    return NextResponse.json(rubrics)
  } catch (error) {
    console.error('Error fetching rubrics:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// POST /api/coaching/rubrics - Create a new rubric
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const { name, content } = body

    if (!name || !content) {
      return new NextResponse('Name and content are required', { status: 400 })
    }

    const rubric = {
      id: crypto.randomUUID(),
      name,
      content,
      userId: session.user.id,
      createdAt: new Date().toISOString(),
      type: 'rubric',
    }

    const { resource: createdRubric } = await container.items.create(rubric)

    return NextResponse.json(createdRubric)
  } catch (error) {
    console.error('Error creating rubric:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 