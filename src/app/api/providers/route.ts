import { NextResponse } from 'next/server';
import { CosmosClient } from '@azure/cosmos';

const endpoint = process.env.NEXT_PUBLIC_COSMOS_ENDPOINT;
const key = process.env.NEXT_PUBLIC_COSMOS_KEY;
const databaseId = process.env.NEXT_PUBLIC_COSMOS_DATABASE_ID;

if (!endpoint || !key || !databaseId) {
  throw new Error('Missing required Cosmos DB configuration');
}

const client = new CosmosClient({ endpoint, key });
const providersContainer = client.database(databaseId).container('providers');

export async function GET() {
  try {
    const { resources: providers } = await providersContainer.items
      .query({
        query: 'SELECT c.id, c.providerName, c.title, c.contact FROM c'
      })
      .fetchAll();

    // Transform the data to match the expected format
    const transformedProviders = providers.map(provider => ({
      id: provider.id,
      name: provider.providerName,
      role: provider.title,
      status: 'active', // Default status since it's not in the Cosmos DB structure
      contact: provider.contact
    }));

    return NextResponse.json(transformedProviders);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
} 