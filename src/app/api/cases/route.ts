import { NextResponse } from 'next/server';
import { CosmosClient } from '@azure/cosmos';

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE_ID;

if (!endpoint || !key || !databaseId) {
  throw new Error('Missing required Cosmos DB configuration');
}

const client = new CosmosClient({ endpoint, key });
const casesContainer = client.database(databaseId).container('cases');

export async function GET() {
  try {
    const { resources: cases } = await casesContainer.items
      .query({
        query: 'SELECT * FROM c'
      })
      .fetchAll();

    return NextResponse.json(cases);
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cases' },
      { status: 500 }
    );
  }
} 