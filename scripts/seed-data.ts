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
const coachingContainer = client.database(databaseId).container('coaching-sessions');
const reviewContainer = client.database(databaseId).container('provider-reviews');
const casesContainer = client.database(databaseId).container('cases');
const providersContainer = client.database(databaseId).container('providers');
const childrenContainer = client.database(databaseId).container('children');
const caregiversContainer = client.database(databaseId).container('caregivers');

// --- DATA ARRAYS ---
// (Insert your full arrays for cases, children, caregivers, providers here)
// For brevity, only a few sample entries are shown. Replace/add as needed.

const cases: any[] = [
  // ... your full cases array ...
];
const children: any[] = [
  // ... your full children array ...
];
const caregivers: any[] = [
  // ... your full caregivers array ...
];
const providers: any[] = [
  // ... your full providers array ...
];

async function seedData() {
  try {
    console.log('Starting data seeding...');

    // Seed caregivers
    console.log('Seeding caregivers...');
    for (const caregiver of caregivers) {
      await caregiversContainer.items.upsert(caregiver);
      console.log(`Upserted caregiver ${caregiver.firstName} ${caregiver.lastName}`);
    }

    // Seed children
    console.log('Seeding children...');
    for (const child of children) {
      await childrenContainer.items.upsert(child);
      console.log(`Upserted child ${child.firstName} ${child.lastName}`);
    }

    // Seed providers
    console.log('Seeding providers...');
    for (const provider of providers) {
      await providersContainer.items.upsert(provider);
      console.log(`Upserted provider ${provider.providerName}`);
    }

    // Seed cases (should be done after other entities are seeded)
    console.log('Seeding cases...');
    for (const case_ of cases) {
      await casesContainer.items.upsert(case_);
      console.log(`Upserted case ${case_.id}`);
    }

    console.log('Data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
}

// Run the seeding function
seedData().catch(console.error); 