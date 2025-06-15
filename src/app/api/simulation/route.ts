import { NextResponse } from 'next/server'
import { getCosmosClient } from '@/lib/cosmos'
import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import { getContextForCase } from '@/lib/vectorization'

// Initialize LangChain models
const chatModel = new ChatOpenAI({
  openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
})

// Helper function to parse JSON from AI response
function parseAIResponse(response: string) {
  try {
    // Remove markdown code block if present
    const jsonStr = response.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(jsonStr)
  } catch (error) {
    console.error('Error parsing AI response:', error)
    console.error('Raw response:', response)
    throw new Error('Failed to parse AI response')
  }
}

// Helper function to format family information
function formatFamilyInfo(caseData: any) {
  const family = caseData.family || {}
  const children = family.children || []
  const caregivers = family.caregivers || []
  const parents = family.parents || {}

  return {
    children: children.map((child: any) => ({
      name: child.name || 'Child',
      age: child.age,
      needs: child.needs || [],
      concerns: child.concerns || []
    })),
    caregivers: caregivers.map((caregiver: any) => ({
      name: caregiver.name || 'Caregiver',
      role: caregiver.role,
      concerns: caregiver.concerns || [],
      supportNeeds: caregiver.supportNeeds || []
    })),
    parents: {
      mother: parents.mother ? {
        name: parents.mother.name || 'Mother',
        concerns: parents.mother.concerns || [],
        supportNeeds: parents.mother.supportNeeds || []
      } : null,
      father: parents.father ? {
        name: parents.father.name || 'Father',
        concerns: parents.father.concerns || [],
        supportNeeds: parents.father.supportNeeds || []
      } : null
    }
  }
}

// POST /api/simulation - Generate a scenario and evaluate response
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { providerId, caseId, action } = body

    if (!providerId || !caseId) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      )
    }

    // Get provider and case data
    const client = await getCosmosClient()
    const databaseId = process.env.NEXT_PUBLIC_COSMOS_DATABASE_ID
    if (!databaseId) throw new Error('Database ID not configured')

    const database = client.database(databaseId)
    const providersContainer = database.container('providers')
    const casesContainer = database.container('cases')

    // Get case details first
    let caseData
    try {
      const { resource } = await casesContainer.item(caseId).read()
      caseData = resource
      console.log('Case data:', caseData)
    } catch (error) {
      console.error('Error fetching case:', error)
      return NextResponse.json(
        { error: 'Failed to fetch case data' },
        { status: 500 }
      )
    }

    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      )
    }

    // Get case context using LangChain
    const query = `
      Case Type: ${caseData.type}
      Status: ${caseData.status}
      Goals: ${caseData.goals?.map((g: any) => g.description).join(', ')}
      Challenges: ${caseData.challenges?.join(', ')}
      Key Interventions: ${caseData.keyInterventions?.join(', ')}
      Family Members:
      ${caseData.family?.children?.map((child: any) => `
        Child: ${child.name}
        Age: ${child.age}
        Needs: ${child.needs?.join(', ')}
        Concerns: ${child.concerns?.join(', ')}
      `).join('\n')}
      ${caseData.family?.caregivers?.map((caregiver: any) => `
        Caregiver: ${caregiver.name}
        Role: ${caregiver.role}
        Concerns: ${caregiver.concerns?.join(', ')}
        Support Needs: ${caregiver.supportNeeds?.join(', ')}
      `).join('\n')}
    `

    console.log(`Getting context for case ${caseId} with query:`, query)

    let context
    try {
      // Try to get context using LangChain
      context = await getContextForCase(caseId, query, {
        limit: 5,
        threshold: 0.8
      })
    } catch (error) {
      console.log(`Failed to get context for case ${caseId}, falling back to direct case data`)
      
      // If vector search fails, use the case data directly
      context = {
        documents: [{
          id: caseData.id,
          content: query,
          metadata: {
            type: 'case',
            caseId: caseData.id,
            timestamp: new Date().toISOString()
          }
        }],
        summary: caseData.summary || caseData.notes?.[0]?.content || 'No summary available'
      }
    }

    // Use the assigned worker from the case
    const assignedWorkerId = caseData.assignedWorker?.id
    if (!assignedWorkerId) {
      return NextResponse.json(
        { error: 'No assigned worker found for this case' },
        { status: 404 }
      )
    }

    // Get provider details using the assigned worker ID
    let provider
    try {
      const { resource } = await providersContainer.item(assignedWorkerId).read()
      provider = resource
      console.log('Provider data:', provider)
    } catch (error) {
      console.error('Error fetching provider:', error)
      // If provider not found, use the assigned worker data from the case
      provider = {
        id: caseData.assignedWorker.id,
        providerName: caseData.assignedWorker.name,
        email: caseData.assignedWorker.email,
        contact: caseData.assignedWorker.contact
      }
    }

    if (action === 'generate') {
      // Generate a scenario
      const scenarioPrompt = PromptTemplate.fromTemplate(`
        Based on the following case context, generate a realistic scenario that you need to respond to.
        The scenario should be challenging and require critical thinking.

        Case Context:
        {context}

        Generate a scenario that:
        1. Is realistic and based on the case context
        2. Presents a challenging situation
        3. Requires you to make a decision or take action
        4. Uses actual names from the case (e.g. "Sophia", "Maria", "Carlos", "Rosa")
        5. Addresses you directly as "you"
        6. Focuses on the immediate situation without repeating known case details

        Return ONLY a JSON object in this format, with no markdown formatting or additional text:
        {{
          "scenario": "The scenario description",
          "expectedElements": [
            "Key element 1 that should be in the response",
            "Key element 2 that should be in the response",
            "Key element 3 that should be in the response"
          ]
        }}
      `)

      const scenarioChain = RunnableSequence.from([
        scenarioPrompt,
        chatModel,
        new StringOutputParser(),
      ])

      const scenarioJson = await scenarioChain.invoke({
        context: context.documents.map((doc: any) => doc.content).join('\n\n')
      })

      const scenario = parseAIResponse(scenarioJson)
      return NextResponse.json(scenario)
    }

    if (action === 'evaluate') {
      const { scenario, response, expectedElements } = body

      // Evaluate the response
      const evaluationPrompt = PromptTemplate.fromTemplate(`
        Evaluate the response to the scenario based on the case context and expected elements.

        Case Context:
        {context}

        Scenario:
        {scenario}

        Response:
        {response}

        Expected Elements:
        {expectedElements}

        Evaluate the response on:
        1. Completeness (did they address all key aspects?)
        2. Appropriateness (is the response suitable for the situation?)
        3. Professionalism (is the response professional and ethical?)
        4. Critical Thinking (did they consider all factors?)
        5. Alignment with Case Goals (does it support the case objectives?)
        6. Child Safety and Well-being (did they prioritize safety?)
        7. Caregiver Support (did they consider family needs and challenges?)

        Return ONLY a JSON object in this format, with no markdown formatting or additional text:
        {{
          "score": number (0-100),
          "feedback": "Detailed feedback on the response",
          "strengths": ["Strength 1", "Strength 2"],
          "areasForImprovement": ["Area 1", "Area 2"],
          "missingElements": ["Missing element 1", "Missing element 2"]
        }}
      `)

      const evaluationChain = RunnableSequence.from([
        evaluationPrompt,
        chatModel,
        new StringOutputParser(),
      ])

      const evaluationJson = await evaluationChain.invoke({
        context: context.documents.map((doc: any) => doc.content).join('\n\n'),
        scenario,
        response,
        expectedElements: JSON.stringify(expectedElements)
      })

      const evaluation = parseAIResponse(evaluationJson)
      return NextResponse.json(evaluation)
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Simulation error:', error)
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 