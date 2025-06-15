import { NextResponse } from 'next/server';
import { CosmosClient } from '@azure/cosmos';

interface Therapy {
  type: string;
  // Add other therapy properties as needed
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  currentAge: number;
  caseHistory?: {
    currentCase?: {
      status: string;
    };
  };
  behavioralHealth?: {
    currentTherapies?: Therapy[];
  };
}

async function getContainer() {
  const endpoint = process.env.NEXT_PUBLIC_COSMOS_ENDPOINT;
  const key = process.env.NEXT_PUBLIC_COSMOS_KEY;
  const databaseId = process.env.NEXT_PUBLIC_COSMOS_DATABASE_ID;

  if (!endpoint || !key || !databaseId) {
    throw new Error('Missing required Cosmos DB configuration');
  }

  const client = new CosmosClient({ endpoint, key });
  return client.database(databaseId).container('children');
}

export async function GET() {
  try {
    const childrenContainer = await getContainer();

    const { resources: children } = await childrenContainer.items
      .query({
        query: 'SELECT c.id, c.firstName, c.lastName, c.currentAge, c.caseHistory, c.behavioralHealth FROM c'
      })
      .fetchAll();

    // Transform the data to match the expected format
    const transformedChildren = children.map((child: Child) => ({
      id: child.id,
      name: `${child.firstName} ${child.lastName}`,
      age: child.currentAge,
      status: child.caseHistory?.currentCase?.status || 'unknown',
      needs: child.behavioralHealth?.currentTherapies?.map((t: Therapy) => t.type) || []
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