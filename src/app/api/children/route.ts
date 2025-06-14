import { NextResponse } from 'next/server';
import { CosmosClient } from '@azure/cosmos';

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE_ID;

if (!endpoint || !key || !databaseId) {
  throw new Error('Missing required Cosmos DB configuration');
}

const client = new CosmosClient({ endpoint, key });
const childrenContainer = client.database(databaseId).container('children');

export async function GET() {
  try {
    const { resources: children } = await childrenContainer.items
      .query({
        query: 'SELECT c.id, c.firstName, c.lastName, c.currentAge, c.caseHistory FROM c'
      })
      .fetchAll();

    // Transform the data to match the expected format
    const transformedChildren = children.map(child => ({
      id: child.id,
      name: `${child.firstName} ${child.lastName}`,
      age: child.currentAge,
      status: child.caseHistory?.currentCase?.status || 'unknown',
      needs: child.behavioralHealth?.currentTherapies?.map(t => t.type) || []
    }));

    return NextResponse.json(transformedChildren);
  } catch (error) {
    console.error('Error fetching children:', error);
    return NextResponse.json(
      { error: 'Failed to fetch children' },
      { status: 500 }
    );
  }
} 