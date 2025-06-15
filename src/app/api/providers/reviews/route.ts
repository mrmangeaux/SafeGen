import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CosmosClient } from '@azure/cosmos'

const endpoint = process.env.COSMOS_ENDPOINT!
const key = process.env.COSMOS_KEY!
const databaseId = process.env.COSMOS_DATABASE!
const containerId = 'reviews'

const client = new CosmosClient({ endpoint, key })
const container = client.database(databaseId).container(containerId)

// POST /api/providers/reviews - Create a new review
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const { providerId, rating, comment, rubricId, rubricEvaluation } = body

    if (!providerId || !rating || !comment) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const review = {
      id: crypto.randomUUID(),
      providerId,
      rating,
      comment,
      rubricId,
      rubricEvaluation,
      userId: session.user.id,
      createdAt: new Date().toISOString(),
      type: 'review',
    }

    const { resource: createdReview } = await container.items.create(review)

    return NextResponse.json(createdReview)
  } catch (error) {
    console.error('Error creating review:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// GET /api/providers/reviews - Get reviews for a provider
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')

    if (!providerId) {
      return new NextResponse('Provider ID is required', { status: 400 })
    }

    const { resources: reviews } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE c.providerId = @providerId AND c.type = "review" ORDER BY c.createdAt DESC',
        parameters: [{ name: '@providerId', value: providerId }],
      })
      .fetchAll()

    // If reviews have rubric evaluations, fetch the corresponding rubrics
    const reviewsWithRubrics = await Promise.all(
      reviews.map(async (review) => {
        if (review.rubricId) {
          const { resources: rubrics } = await client
            .database(databaseId)
            .container('rubrics')
            .items
            .query({
              query: 'SELECT * FROM c WHERE c.id = @rubricId',
              parameters: [{ name: '@rubricId', value: review.rubricId }],
            })
            .fetchAll()

          if (rubrics.length > 0) {
            return {
              ...review,
              rubric: rubrics[0],
            }
          }
        }
        return review
      })
    )

    return NextResponse.json(reviewsWithRubrics)
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 