import { NextResponse } from 'next/server'
import { getCosmosClient } from '@/lib/cosmos'
import { v4 as uuidv4 } from 'uuid'

// GET /api/cases/[caseId]/notes - Get all notes for a case
export async function GET(
  request: Request,
  { params }: { params: { caseId: string } }
) {
  try {
    console.log('Fetching notes for case:', params.caseId)
    const client = await getCosmosClient()
    const databaseId = process.env.NEXT_PUBLIC_COSMOS_DATABASE_ID
    
    if (!databaseId) {
      throw new Error('NEXT_PUBLIC_COSMOS_DATABASE_ID is not set')
    }

    const database = client.database(databaseId)
    const casesContainer = database.container('cases')
    
    // Get the case document which contains the notes
    const { resource: caseData } = await casesContainer.item(params.caseId).read()
    
    if (!caseData) {
      console.log('Case not found:', params.caseId)
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Return the notes array from the case document
    const notes = caseData.notes || []
    console.log(`Found ${notes.length} notes for case ${params.caseId}`)
    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching case notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch case notes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/cases/[caseId]/notes - Add a new note to a case
export async function POST(
  request: Request,
  { params }: { params: { caseId: string } }
) {
  try {
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const client = await getCosmosClient()
    const databaseId = process.env.NEXT_PUBLIC_COSMOS_DATABASE_ID
    
    if (!databaseId) {
      throw new Error('NEXT_PUBLIC_COSMOS_DATABASE_ID is not set')
    }

    const database = client.database(databaseId)
    const casesContainer = database.container('cases')
    
    // Get the current case document
    const { resource: caseData } = await casesContainer.item(params.caseId).read()
    
    if (!caseData) {
      console.log('Case not found:', params.caseId)
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Create the new note
    const newNote = {
      date: new Date().toISOString(),
      author: 'Sarah Johnson', // TODO: Get from auth context
      content,
      type: 'progress_note'
    }

    // Add the new note to the case's notes array
    const updatedNotes = [...(caseData.notes || []), newNote]
    
    // Create the updated case document
    const updatedCase = {
      ...caseData,
      notes: updatedNotes,
      _ts: caseData._ts // Preserve the timestamp
    }

    // Update the case document
    const { resource } = await casesContainer.item(params.caseId).replace(updatedCase)
    console.log('Updated case with new note:', resource)

    return NextResponse.json(newNote)
  } catch (error) {
    console.error('Error adding case note:', error)
    return NextResponse.json(
      { error: 'Failed to add case note', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 