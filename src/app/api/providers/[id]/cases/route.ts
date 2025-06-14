import { NextResponse } from 'next/server';
import { getCosmosClient } from '@/lib/cosmos';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await getCosmosClient();
    const container = client.database('safegen').container('cases');

    // Query cases where the provider is involved
    const { resources: cases } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(c.services.providers, @providerId)',
        parameters: [{ name: '@providerId', value: params.id }],
      })
      .fetchAll();

    return NextResponse.json(cases);
  } catch (error) {
    console.error('Error fetching provider cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider cases' },
      { status: 500 }
    );
  }
} 