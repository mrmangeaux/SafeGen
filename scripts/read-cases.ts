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
const casesContainer = database.container('cases');

async function readCases() {
  try {
    console.log('Reading all cases from the cases container...');
    const { resources: cases } = await casesContainer.items.readAll().fetchAll();
    console.log(`Found ${cases.length} cases.`);
    console.log(JSON.stringify(cases, null, 2));
  } catch (error) {
    console.error('Error reading cases:', error);
    throw error;
  }
}

// Run the function
readCases().catch(console.error); 