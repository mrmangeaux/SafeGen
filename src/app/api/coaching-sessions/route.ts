import { NextResponse } from 'next/server';
import { CosmosClient } from '@azure/cosmos';

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE_ID;

if (!endpoint || !key || !databaseId) {
  throw new Error('Missing required Cosmos DB configuration');
}

const client = new CosmosClient({ endpoint, key });
const coachingContainer = client.database(databaseId).container('coaching-sessions');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Generate a unique ID for the coaching session
    const id = `cs${Date.now()}`;
    
    const session = {
      id,
      ...body,
      createdAt: new Date().toISOString()
    };

    const { resource } = await coachingContainer.items.upsert(session);
    
    return NextResponse.json(resource);
  } catch (error) {
    console.error('Error creating coaching session:', error);
    return NextResponse.json(
      { error: 'Failed to create coaching session' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { resources } = await coachingContainer.items
      .query('SELECT * FROM c ORDER BY c.date DESC')
      .fetchAll();
    
    return NextResponse.json(resources);
  } catch (error) {
    console.error('Error fetching coaching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coaching sessions' },
      { status: 500 }
    );
  }
} 