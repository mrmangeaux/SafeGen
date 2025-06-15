export interface Family {
  id: number
  name: string
  caseNumber: string
  status: 'Active' | 'Review' | 'Closed'
  lastUpdated: string
  caseworker: string
  members: FamilyMember[]
  documents: Document[]
  goals: Goal[]
  notes: Note[]
}

export interface FamilyMember {
  id: number
  name: string
  role: string
  dateOfBirth: string
  contactInfo: ContactInfo
}

export interface ContactInfo {
  phone: string
  email: string
  address: string
}

export interface Document {
  id: number
  name: string
  type: string
  uploadDate: string
  url: string
  uploadedBy: string
}

export interface Goal {
  id: number
  title: string
  description: string
  status: 'Not Started' | 'In Progress' | 'Completed'
  dueDate: string
  assignedTo: string
  progress: number
}

export interface Note {
  id: number
  content: string
  createdAt: string
  createdBy: string
  type: 'Case Note' | 'Progress Update' | 'Risk Assessment'
} 