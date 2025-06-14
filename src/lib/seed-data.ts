// Export the seed data for use in the dashboard
export const seedData = {
  children: [
    {
      id: 'child_001',
      name: 'Emma Rodriguez',
      age: 8,
      status: 'in_care',
      needs: ['educational_support', 'trauma_counseling']
    },
    {
      id: 'child_002',
      name: 'Lucas Rodriguez',
      age: 6,
      status: 'in_care',
      needs: ['educational_support', 'speech_therapy']
    },
    {
      id: 'child_003',
      name: 'Sophia Garcia',
      age: 10,
      status: 'reunified',
      needs: ['educational_support']
    },
    {
      id: 'child_004',
      name: 'James Williams',
      age: 7,
      status: 'in_care',
      needs: ['behavioral_support', 'educational_support']
    },
    {
      id: 'child_005',
      name: 'Olivia Thompson',
      age: 9,
      status: 'adopted',
      needs: ['trauma_counseling']
    },
    {
      id: 'child_006',
      name: 'Noah Hernandez',
      age: 5,
      status: 'in_care',
      needs: ['developmental_support']
    },
    {
      id: 'child_007',
      name: 'Ava Jackson',
      age: 6,
      status: 'reunified',
      needs: ['trauma_counseling']
    }
  ],
  caregivers: [
    {
      id: 'caregiver_001',
      name: 'Maria Rodriguez',
      type: 'kinship',
      status: 'active',
      contact: {
        phone: '(555) 123-4567',
        email: 'm.rodriguez@email.com'
      }
    },
    {
      id: 'caregiver_002',
      name: 'Rosa Garcia',
      type: 'kinship',
      status: 'active',
      contact: {
        phone: '(555) 234-5678',
        email: 'r.garcia@email.com'
      }
    },
    {
      id: 'caregiver_003',
      name: 'Robert Williams',
      type: 'kinship',
      status: 'active',
      contact: {
        phone: '(555) 345-6789',
        email: 'r.williams@email.com'
      }
    },
    {
      id: 'caregiver_004',
      name: 'Patricia Thompson',
      type: 'foster',
      status: 'active',
      contact: {
        phone: '(555) 456-7890',
        email: 'p.thompson@email.com'
      }
    },
    {
      id: 'caregiver_005',
      name: 'Carlos Hernandez',
      type: 'kinship',
      status: 'active',
      contact: {
        phone: '(555) 567-8901',
        email: 'c.hernandez@email.com'
      }
    },
    {
      id: 'caregiver_006',
      name: 'Dorothy Jackson',
      type: 'kinship',
      status: 'active',
      contact: {
        phone: '(555) 678-9012',
        email: 'd.jackson@email.com'
      }
    }
  ],
  parents: [
    {
      id: 'parent_001',
      name: 'Isabella Rodriguez',
      status: 'in_treatment',
      contact: {
        phone: '(555) 345-6789',
        email: 'i.rodriguez@email.com'
      }
    },
    {
      id: 'parent_002',
      name: 'Maria Garcia',
      status: 'reunified',
      contact: {
        phone: '(555) 234-5678',
        email: 'm.garcia@email.com'
      }
    },
    {
      id: 'parent_003',
      name: 'Jessica Williams',
      status: 'incarcerated',
      contact: {
        phone: '(555) 456-7890',
        email: 'j.williams@email.com'
      }
    },
    {
      id: 'parent_004',
      name: 'Lisa Thompson',
      status: 'terminated',
      contact: {
        phone: '(555) 567-8901',
        email: 'l.thompson@email.com'
      }
    },
    {
      id: 'parent_005',
      name: 'Latoya Jackson',
      status: 'reunified',
      contact: {
        phone: '(555) 789-0123',
        email: 'l.jackson@email.com'
      }
    }
  ],
  providers: [
    {
      id: 'p1',
      name: 'Sarah Johnson',
      role: 'case_worker',
      status: 'active',
      contact: {
        phone: '(555) 123-4567',
        email: 's.johnson@childservices.gov'
      }
    },
    {
      id: 'p2',
      name: 'Michael Chen',
      role: 'case_worker',
      status: 'active',
      contact: {
        phone: '(555) 234-5678',
        email: 'm.chen@childservices.gov'
      }
    }
  ],
  cases: [
    // ... existing cases from seed-data.ts ...
  ]
}; 