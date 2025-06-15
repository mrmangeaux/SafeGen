import { NextResponse } from 'next/server'
import { CosmosClient } from '@azure/cosmos'

async function getClient() {
  const endpoint = process.env.NEXT_PUBLIC_COSMOS_ENDPOINT;
  const key = process.env.NEXT_PUBLIC_COSMOS_KEY;

  if (!endpoint || !key) {
    throw new Error('Missing required Cosmos DB configuration');
  }

  return new CosmosClient({ endpoint, key });
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await getClient();
    const database = client.database('safegen');
    
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

      // Add items to appropriate context array
      switch (container.id) {
        case 'providers':
          context.provider = items[0] || null;
          break;
        case 'cases':
          context.cases = items;
          break;
        case 'provider-reviews':
          context.reviews = items;
          break;
        case 'Documents-1':
          context.documents = items;
          break;
        case 'communications':
          context.communications = items;
          break;
        case 'services':
          context.services = items;
          break;
        case 'tasks':
          context.tasks = items;
          break;
        case 'notes':
          context.notes = items;
          break;
        case 'attachments':
          context.attachments = items;
          break;
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
    console.error('Error getting comprehensive context:', error)
    return NextResponse.json(
      { error: 'Failed to get comprehensive context' },
      { status: 500 }
    )
  }
} 