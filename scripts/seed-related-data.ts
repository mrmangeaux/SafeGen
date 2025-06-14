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
const childrenContainer = database.container('children');
const providersContainer = database.container('providers');
const caregiversContainer = database.container('caregivers');

// Sample data based on the cases
const children = [
  {
    id: 'child_001',
    firstName: 'Emma',
    lastName: 'Rodriguez',
    dateOfBirth: '2016-07-12',
    gender: 'female',
    currentAge: 8,
    ethnicity: 'Hispanic',
    languages: ['English', 'Spanish'],
    currentPlacement: {
      type: 'kinship_care',
      placementDate: '2024-03-20T14:00:00Z',
      address: '456 Oak Street, Springfield, IL 62701',
      caregiver: {
        name: 'Maria Santos',
        relationship: 'Maternal Aunt',
        contact: {
          phone: '(555) 789-0123',
          email: 'm.santos@email.com'
        }
      }
    },
    education: {
      currentSchool: {
        name: 'Lincoln Elementary School',
        grade: '3rd',
        teacher: 'Ms. Thompson',
        contact: '(555) 456-7891'
      },
      academicPerformance: {
        reading: 'below_grade_level',
        math: 'at_grade_level',
        science: 'at_grade_level',
        socialStudies: 'above_grade_level'
      }
    },
    behavioralHealth: {
      currentTherapies: [
        {
          type: 'trauma_counseling',
          provider: 'Dr. Sarah Wilson',
          frequency: 'weekly'
        },
        {
          type: 'educational_support',
          provider: 'Lincoln Elementary School',
          frequency: 'daily'
        }
      ]
    }
  },
  {
    id: 'child_002',
    firstName: 'Diego',
    lastName: 'Rodriguez',
    dateOfBirth: '2019-03-15',
    gender: 'male',
    currentAge: 5,
    ethnicity: 'Hispanic',
    languages: ['English', 'Spanish'],
    currentPlacement: {
      type: 'kinship_care',
      placementDate: '2024-03-20T14:00:00Z',
      address: '456 Oak Street, Springfield, IL 62701',
      caregiver: {
        name: 'Maria Santos',
        relationship: 'Maternal Aunt',
        contact: {
          phone: '(555) 789-0123',
          email: 'm.santos@email.com'
        }
      }
    },
    behavioralHealth: {
      currentTherapies: [
        {
          type: 'speech_therapy',
          provider: 'Springfield Speech Center',
          frequency: 'weekly'
        }
      ]
    }
  },
  {
    id: 'child_003',
    firstName: 'Sophia',
    lastName: 'Garcia',
    dateOfBirth: '2014-05-20',
    gender: 'female',
    currentAge: 10,
    ethnicity: 'Hispanic',
    languages: ['English', 'Spanish'],
    currentPlacement: {
      type: 'kinship_care',
      placementDate: '2023-02-01T14:00:00Z',
      address: '789 Pine Street, Springfield, IL 62701',
      caregiver: {
        name: 'Rosa Garcia',
        relationship: 'Maternal Grandmother',
        contact: {
          phone: '(555) 234-5678',
          email: 'r.garcia@email.com'
        }
      }
    },
    behavioralHealth: {
      currentTherapies: [
        {
          type: 'educational_support',
          provider: 'Springfield Middle School',
          frequency: 'daily'
        }
      ]
    }
  }
];

const providers = [
  {
    id: 'p1',
    providerName: 'Sarah Johnson',
    title: 'Senior Caseworker',
    department: 'Family Services',
    startDate: '2020-01-15T00:00:00Z',
    contact: {
      phone: '(555) 123-4567',
      email: 's.johnson@childservices.gov',
      address: '123 Main St, Springfield, IL 62701'
    },
    credentials: {
      education: [
        {
          degree: 'MSW',
          institution: 'University of Illinois',
          year: 2019,
          specialization: 'Child Welfare'
        }
      ],
      certifications: [
        'Licensed Clinical Social Worker',
        'Trauma-Informed Care Specialist',
        'Crisis Intervention Certified'
      ]
    }
  },
  {
    id: 'p2',
    providerName: 'Michael Chen',
    title: 'Caseworker',
    department: 'Family Services',
    startDate: '2021-06-01T00:00:00Z',
    contact: {
      phone: '(555) 234-5678',
      email: 'm.chen@childservices.gov',
      address: '123 Main St, Springfield, IL 62701'
    },
    credentials: {
      education: [
        {
          degree: 'MSW',
          institution: 'University of Chicago',
          year: 2021,
          specialization: 'Child Welfare'
        }
      ],
      certifications: [
        'Licensed Social Worker',
        'Trauma-Informed Care Certified'
      ]
    }
  }
];

const caregivers = [
  {
    id: 'caregiver_001',
    firstName: 'Maria',
    lastName: 'Santos',
    type: 'kinship',
    relationship: 'Maternal Aunt',
    contact: {
      phone: '(555) 789-0123',
      email: 'm.santos@email.com',
      address: '456 Oak Street, Springfield, IL 62701'
    },
    background: {
      employment: {
        status: 'employed',
        employer: 'Springfield General Hospital',
        position: 'Registered Nurse',
        workSchedule: 'Monday-Friday, 7am-3pm'
      },
      education: {
        highestLevel: 'bachelors',
        field: 'Nursing',
        institution: 'University of Illinois'
      }
    }
  },
  {
    id: 'caregiver_002',
    firstName: 'Rosa',
    lastName: 'Garcia',
    type: 'kinship',
    relationship: 'Maternal Grandmother',
    contact: {
      phone: '(555) 234-5678',
      email: 'r.garcia@email.com',
      address: '789 Pine Street, Springfield, IL 62701'
    },
    background: {
      employment: {
        status: 'retired',
        previousEmployer: 'Springfield School District',
        previousPosition: 'Teacher'
      },
      education: {
        highestLevel: 'masters',
        field: 'Education',
        institution: 'University of Illinois'
      }
    }
  }
];

async function seedData() {
  try {
    console.log('Starting data seeding...');

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

    // Seed caregivers
    console.log('Seeding caregivers...');
    for (const caregiver of caregivers) {
      await caregiversContainer.items.upsert(caregiver);
      console.log(`Upserted caregiver ${caregiver.firstName} ${caregiver.lastName}`);
    }

    console.log('Data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
}

// Run the seeding function
seedData().catch(console.error); 