import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { CosmosClient } from '@azure/cosmos';

// Initialize Cosmos DB client
const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE_ID;

if (!endpoint || !key || !databaseId) {
  throw new Error('Missing required Cosmos DB configuration');
}

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);
const reviewsContainer = database.container('provider-reviews');

async function readReviews() {
  try {
    console.log('Reading all provider reviews...');
    const { resources: reviews } = await reviewsContainer.items.readAll().fetchAll();
    console.log(`Found ${reviews.length} reviews.`);
    console.log(JSON.stringify(reviews, null, 2));
  } catch (error) {
    console.error('Error reading reviews:', error);
    throw error;
  }
}

// Run the function
readReviews().catch(console.error); 