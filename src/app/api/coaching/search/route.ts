import { NextResponse } from 'next/server';
import { getCosmosClient } from '@/lib/cosmos';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';

    const client = await getCosmosClient();
    const container = client.database('safegen').container('coaching-sessions');

    // Search for coaching sessions
    const { resources } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE CONTAINS(c.providerName, @query) OR CONTAINS(c.notes, @query)',
        parameters: [{ name: '@query', value: query }],
      })
      .fetchAll();

    return NextResponse.json(resources);
  } catch (error) {
    console.error('Error searching coaching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to search coaching sessions' },
      { status: 500 }
    );
  }
} 