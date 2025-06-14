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

async function readSchema() {
  try {
    console.log('Reading database schema...');
    
    // Get all containers
    const { resources: containers } = await database.containers.readAll().fetchAll();
    
    console.log('\nContainers found:');
    for (const container of containers) {
      console.log(`\nContainer: ${container.id}`);
      
      // Get sample items from each container
      const containerClient = database.container(container.id);
      const { resources: items } = await containerClient.items.readAll().fetchAll();
      if (items.length > 0) {
        console.log('Sample item schema:');
        console.log(JSON.stringify(items[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('Error reading schema:', error);
    throw error;
  }
}

// Run the schema reading function
readSchema().catch(console.error); 