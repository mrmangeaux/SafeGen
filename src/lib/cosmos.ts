// import { CosmosClient } from '@azure/cosmos';

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../../.env.local') });

import { CosmosClient } from '@azure/cosmos';

let client: CosmosClient | null = null;

export async function getCosmosClient(): Promise<CosmosClient> {
  if (!client) {
    console.log('Creating Cosmos Client');
    const endpoint = process.env.NEXT_PUBLIC_COSMOS_ENDPOINT;
    const key = process.env.NEXT_PUBLIC_COSMOS_KEY;

    if (!endpoint || !key) {
      throw new Error('Missing required Cosmos DB configuration');
    }

    client = new CosmosClient({ endpoint, key });
  }

  return client;
} 