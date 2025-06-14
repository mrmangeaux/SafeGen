import { NextResponse } from 'next/server';
import { getCosmosClient } from '@/lib/cosmos';

export async function POST(request: Request) {
  try {
    const review = await request.json();
    console.log('Received review data:', review);

    const client = await getCosmosClient();
    const databaseId = process.env.NEXT_PUBLIC_COSMOS_DATABASE_ID;
    
    if (!databaseId) {
      throw new Error('NEXT_PUBLIC_COSMOS_DATABASE_ID is not set');
    }

    console.log('Connecting to database:', databaseId);
    const database = client.database(databaseId);
    const reviewsContainer = database.container('provider-reviews');

    // Generate a unique ID for the review
    const id = `pr${Date.now()}`;
    
    const reviewData = {
      id,
      ...review,
      createdAt: new Date().toISOString(),
      type: 'provider_review'
    };

    console.log('Saving review with data:', reviewData);
    const { resource } = await reviewsContainer.items.upsert(reviewData);
    console.log('Review saved successfully:', resource);
    
    return NextResponse.json(resource);
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const client = await getCosmosClient();
    const databaseId = process.env.NEXT_PUBLIC_COSMOS_DATABASE_ID;
    
    if (!databaseId) {
      throw new Error('NEXT_PUBLIC_COSMOS_DATABASE_ID is not set');
    }

    const database = client.database(databaseId);
    const reviewsContainer = database.container('provider-reviews');

    const { resources } = await reviewsContainer.items
      .query('SELECT * FROM c ORDER BY c.createdAt DESC')
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