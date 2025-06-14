import { NextResponse } from 'next/server';
import { CosmosClient } from '@azure/cosmos';

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE_ID;

if (!endpoint || !key || !databaseId) {
  throw new Error('Missing required Cosmos DB configuration');
}

const client = new CosmosClient({ endpoint, key });
const reviewContainer = client.database(databaseId).container('provider-reviews');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Generate a unique ID for the review
    const id = `pr${Date.now()}`;
    
    const review = {
      id,
      ...body,
      createdAt: new Date().toISOString()
    };

    const { resource } = await reviewContainer.items.upsert(review);
    
    return NextResponse.json(resource);
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { resources } = await reviewContainer.items
      .query('SELECT * FROM c ORDER BY c.reviewDate DESC')
      .fetchAll();
    
    return NextResponse.json(resources);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
} 