import { NextResponse } from 'next/server';
import { getCosmosClient } from '@/lib/cosmos';

interface Note {
  date: string;
  author: string;
  content: string;
  type: string;
}

interface TimelineEvent {
  date: string;
  event: string;
  description: string;
}

interface Goal {
  description: string;
  status: string;
  targetDate: string;
  completionDate?: string;
}

export async function GET() {
  try {
    console.log('Fetching cases from Cosmos DB...')
    const client = await getCosmosClient()
    const databaseId = process.env.NEXT_PUBLIC_COSMOS_DATABASE_ID
    
    if (!databaseId) {
      throw new Error('NEXT_PUBLIC_COSMOS_DATABASE_ID is not set')
    }

    const database = client.database(databaseId)
    const container = database.container('cases')
    
    const { resources: cases } = await container.items
      .query({
        query: 'SELECT * FROM c'
      })
      .fetchAll()

    console.log(`Found ${cases.length} cases`)
    if (cases.length > 0) {
      console.log('Sample case structure:', JSON.stringify(cases[0], null, 2))
    }

    // Get all providers
    const providersContainer = database.container('providers')
    const { resources: providers } = await providersContainer.items
      .query({
        query: 'SELECT * FROM c'
      })
      .fetchAll()

    console.log('Sample provider structure:', JSON.stringify(providers[0], null, 2))

    // Create a map of provider IDs to names
    const providerMap = new Map(
      providers.map(provider => [
        provider.id, 
        provider.providerName || 'Unknown Provider'
      ])
    )

    // Transform the data to include a description and handle assigned providers
    const transformedCases = cases.map(case_ => {
      // Get assigned providers from various possible fields and deduplicate
      const assignedProviders = [
        ...(case_.assignedTo || []),
        ...(case_.services?.providers || []),
        case_.assignedProviderId,
        case_.primaryProviderId,
        case_.assignedWorker?.id
      ]
        .filter(Boolean) // Remove any undefined/null values
        .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
        .map(id => providerMap.get(id) || id) // Convert IDs to names, fallback to ID if not found

      // Get all notes and sort by date
      const notes = (case_.notes || []).sort((a: Note, b: Note) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      // Get timeline events and sort by date
      const timeline = (case_.timeline || []).sort((a: TimelineEvent, b: TimelineEvent) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      // Get goals and sort by target date
      const goals = (case_.goals || []).sort((a: Goal, b: Goal) => 
        new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime()
      )

      return {
        ...case_,
        id: case_.id,
        caseNumber: case_.id,
        title: case_.title || case_.type || 'Untitled Case',
        description: case_.summary || notes[0]?.content || 'No description available',
        assignedTo: assignedProviders,
        notes,
        timeline,
        goals,
        status: case_.status || 'active',
        startDate: case_.startDate,
        endDate: case_.endDate,
        family: case_.family,
        services: case_.services,
        documents: case_.documents,
        outcome: case_.outcome,
        keyInterventions: case_.keyInterventions,
        challenges: case_.challenges,
        lessonsLearned: case_.lessonsLearned
      }
    })

    return NextResponse.json(transformedCases)
  } catch (error) {
    console.error('Error fetching cases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cases' },
      { status: 500 }
    )
  }
} 