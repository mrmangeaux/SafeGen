import { NextResponse } from 'next/server';
import { CosmosClient } from '@azure/cosmos';

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE_ID;

if (!endpoint || !key || !databaseId) {
  throw new Error('Missing required Cosmos DB configuration');
}

const client = new CosmosClient({ endpoint, key });
const caregiversContainer = client.database(databaseId).container('caregivers');

export async function GET() {
  try {
    const { resources: caregivers } = await caregiversContainer.items
      .query({
        query: 'SELECT c.id, c.firstName, c.lastName, c.type, c.contact FROM c'
      })
      .fetchAll();

    // Transform the data to match the expected format
    const transformedCaregivers = caregivers.map(caregiver => ({
      id: caregiver.id,
      name: `${caregiver.firstName} ${caregiver.lastName}`,
      type: caregiver.type,
      status: 'active', // Default status since it's not in the Cosmos DB structure
      contact: caregiver.contact
    }));

    return NextResponse.json(transformedCaregivers);
  } catch (error) {
    console.error('Error fetching caregivers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch caregivers' },
      { status: 500 }
    );
  }
} 