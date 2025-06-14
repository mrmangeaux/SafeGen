import { NextResponse } from 'next/server'
import { CosmosClient } from '@azure/cosmos'

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT!,
  key: process.env.COSMOS_KEY!
})

const database = client.database('safegen')

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get all containers
    const { resources: containers } = await database.containers.readAll().fetchAll()
    
    // Build context from all containers
    const context: any = {
      provider: null,
      cases: [],
      reviews: [],
      documents: [],
      communications: [],
      services: [],
      tasks: [],
      notes: [],
      attachments: []
    }

    // Process each container
    for (const container of containers) {
      const containerClient = database.container(container.id)
      
      // Query for items related to this provider
      const { resources: items } = await containerClient.items
        .query({
          query: `
            SELECT * FROM c 
            WHERE c.providerId = @providerId 
            OR ARRAY_CONTAINS(c.providers, @providerId)
            OR ARRAY_CONTAINS(c.assignedTo, @providerId)
            OR c.assignedProviderId = @providerId
          `,
          parameters: [{ name: '@providerId', value: params.id }]
        })
        .fetchAll()

      // Categorize items based on container type
      switch (container.id) {
        case 'providers':
          context.provider = items[0] || null
          break
        case 'cases':
          context.cases.push(...items)
          break
        case 'reviews':
          context.reviews.push(...items)
          break
        case 'documents':
          context.documents.push(...items)
          break
        case 'communications':
          context.communications.push(...items)
          break
        case 'services':
          context.services.push(...items)
          break
        case 'tasks':
          context.tasks.push(...items)
          break
        case 'notes':
          context.notes.push(...items)
          break
        case 'attachments':
          context.attachments.push(...items)
          break
      }
    }

    // Get related items from cases
    if (context.cases.length > 0) {
      const caseIds = context.cases.map((c: any) => c.id)
      
      // Get all items related to these cases
      for (const container of containers) {
        const containerClient = database.container(container.id)
        
        const { resources: relatedItems } = await containerClient.items
          .query({
            query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(@caseIds, c.caseId)',
            parameters: [{ name: '@caseIds', value: caseIds }]
          })
          .fetchAll()

        // Add to context if not already included
        switch (container.id) {
          case 'documents':
            context.documents.push(...relatedItems.filter((item: any) => 
              !context.documents.some((d: any) => d.id === item.id)
            ))
            break
          case 'communications':
            context.communications.push(...relatedItems.filter((item: any) => 
              !context.communications.some((c: any) => c.id === item.id)
            ))
            break
          case 'tasks':
            context.tasks.push(...relatedItems.filter((item: any) => 
              !context.tasks.some((t: any) => t.id === item.id)
            ))
            break
          case 'notes':
            context.notes.push(...relatedItems.filter((item: any) => 
              !context.notes.some((n: any) => n.id === item.id)
            ))
            break
          case 'attachments':
            context.attachments.push(...relatedItems.filter((item: any) => 
              !context.attachments.some((a: any) => a.id === item.id)
            ))
            break
        }
      }
    }

    if (!context.provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    return NextResponse.json(context)
  } catch (error) {
    console.error('Error fetching provider context:', error)
    return NextResponse.json(
      { error: 'Failed to fetch provider context' },
      { status: 500 }
    )
  }
} 