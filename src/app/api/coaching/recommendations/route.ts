import { NextResponse } from 'next/server'
import { getCosmosClient } from '@/lib/cosmos'
import { searchSimilarDocuments, getContextForCase, generateRecommendations, vectorizeDocument } from '@/lib/vectorization'

export async function POST(request: Request) {
  console.log('Received recommendation generation request')
  
  try {
    const body = await request.json()
    console.log('Request body:', {
      providerId: body.provider?.id,
      selectedCaseIds: body.selectedCaseIds,
      totalCases: body.cases?.length,
      totalServices: body.services?.length,
      totalTasks: body.tasks?.length,
      totalNotes: body.notes?.length,
      totalReviews: body.reviews?.length
    })

    const { provider, cases, selectedCaseIds, services, tasks, notes, reviews } = body

    if (!provider || !cases || !selectedCaseIds) {
      console.error('Missing required data:', { 
        hasProvider: !!provider, 
        hasCases: !!cases, 
        hasSelectedCaseIds: !!selectedCaseIds 
      })
      return NextResponse.json(
        { message: 'Missing required data' },
        { status: 400 }
      )
    }

    // Get context for each selected case
    const caseContexts = await Promise.all(
      selectedCaseIds.map(async (caseId: string) => {
        try {
          const case_ = cases.find((c: any) => c.id === caseId)
          if (!case_) {
            console.log(`Case not found: ${caseId}`)
            return null
          }

          // Create a query based on case details
          const query = `
            Case Type: ${case_.type}
            Status: ${case_.status}
            Goals: ${case_.goals?.map((g: any) => g.description).join(', ')}
            Challenges: ${case_.challenges?.join(', ')}
            Key Interventions: ${case_.keyInterventions?.join(', ')}
          `

          console.log(`Getting context for case ${caseId} with query:`, query)

          try {
            // Try to get context using LangChain
            const context = await getContextForCase(caseId, query, {
              limit: 5,
              threshold: 0.8
            })

            return {
              caseId,
              context
            }
          } catch (error) {
            console.log(`Failed to get context for case ${caseId}, falling back to direct case data`)
            
            // If vector search fails, use the case data directly
            const documents = [{
              id: case_.id,
              content: `
                Case Type: ${case_.type}
                Status: ${case_.status}
                Goals: ${case_.goals?.map((g: any) => g.description).join(', ')}
                Challenges: ${case_.challenges?.join(', ')}
                Key Interventions: ${case_.keyInterventions?.join(', ')}
                Notes: ${case_.notes?.map((n: any) => n.content).join('\n')}
              `,
              metadata: {
                type: 'case',
                caseId: case_.id,
                timestamp: new Date().toISOString()
              }
            }]

            return {
              caseId,
              context: {
                documents,
                summary: case_.summary || case_.notes?.[0]?.content || 'No summary available'
              }
            }
          }
        } catch (error) {
          console.error(`Error getting context for case ${caseId}:`, error)
          return null
        }
      })
    )

    // Filter out any null results
    const validContexts = caseContexts.filter((ctx): ctx is NonNullable<typeof ctx> => ctx !== null)

    if (validContexts.length === 0) {
      console.log('No valid contexts found, returning default recommendations')
      return NextResponse.json([{
        type: 'approach',
        title: 'General Case Management',
        description: 'Focus on maintaining regular communication with families and documenting all interactions.',
        confidence: 0.8,
        source: 'default'
      }])
    }

    // Generate recommendations using LangChain
    const recommendations = await Promise.all(
      validContexts.map(async ({ caseId, context }) => {
        try {
          // Generate recommendations using LangChain
          const caseRecommendations = await generateRecommendations(caseId, {
            ...context
          })

          return caseRecommendations.recommendations
        } catch (error) {
          console.error(`Error generating recommendations for case ${caseId}:`, error)
          return []
        }
      })
    )

    // Flatten and deduplicate recommendations
    const allRecommendations = recommendations
      .flat()
      .filter((rec, index, self) => 
        index === self.findIndex((r) => r.title === rec.title)
      )

    console.log('Generated recommendations:', {
      total: allRecommendations.length,
      byType: allRecommendations.reduce((acc: any, rec: any) => {
        acc[rec.type] = (acc[rec.type] || 0) + 1
        return acc
      }, {})
    })

    if (allRecommendations.length === 0) {
      console.log('No recommendations generated, creating default recommendations')
      allRecommendations.push({
        type: 'approach',
        title: 'General Case Management',
        description: 'Focus on maintaining regular communication with families and documenting all interactions.',
        confidence: 0.8,
        source: 'default'
      })
    }

    return NextResponse.json(allRecommendations)
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json(
      { message: 'Failed to generate recommendations', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 