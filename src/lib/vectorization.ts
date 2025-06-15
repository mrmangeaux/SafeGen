import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../../.env.local') });

import { OpenAIEmbeddings } from '@langchain/openai'
import { CosmosClient } from '@azure/cosmos'
import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'

// Initialize Cosmos DB client
const endpoint = process.env.NEXT_PUBLIC_COSMOS_ENDPOINT;
const key = process.env.NEXT_PUBLIC_COSMOS_KEY;
const databaseId = process.env.NEXT_PUBLIC_COSMOS_DATABASE_ID;

// Ensure environment variables are loaded
if (!endpoint || !key || !databaseId) {
  throw new Error(`Missing required Cosmos DB configuration:
    NEXT_PUBLIC_COSMOS_ENDPOINT: ${endpoint ? '✓' : '✗'}
    NEXT_PUBLIC_COSMOS_KEY: ${key ? '✓' : '✗'}
    NEXT_PUBLIC_COSMOS_DATABASE_ID: ${databaseId ? '✓' : '✗'}
  `);
}

// Initialize client and containers
const client = new CosmosClient({ endpoint, key });
const coachingContainer = client.database(databaseId).container('coaching-sessions');
const reviewContainer = client.database(databaseId).container('provider-reviews');
const casesContainer = client.database(databaseId).container('cases');
const providersContainer = client.database(databaseId).container('providers');
const childrenContainer = client.database(databaseId).container('children');
const caregiversContainer = client.database(databaseId).container('caregivers');

// Initialize LangChain models
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  modelName: 'text-embedding-3-small',
})

const chatModel = new ChatOpenAI({
  openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
})

interface VectorizedDocument {
  id: string
  content: string
  embedding: number[]
  metadata: {
    type: string
    caseId?: string
    providerId?: string
    timestamp: string
    category?: string
    tags?: string[]
  }
}

interface CaseMetadata {
  id: string
  caseId: string
  lastUpdated: string
  documentCount: number
  vectorCount: number
  summary?: string
}

export async function vectorizeDocument(
  content: string,
  metadata: {
    type: string
    caseId?: string
    providerId?: string
    category?: string
    tags?: string[]
  }
): Promise<VectorizedDocument> {
  try {
    // Generate embedding for the content
    const embedding = await embeddings.embedQuery(content)

    // Create vectorized document
    const vectorizedDoc: VectorizedDocument = {
      id: crypto.randomUUID(),
      content,
      embedding,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    }

    // Store in appropriate container based on type
    const container = getContainerForType(metadata.type)
    if (container) {
      await container.items.create(vectorizedDoc)
    }

    // Update metadata
    if (metadata.caseId) {
      await updateCaseMetadata(metadata.caseId)
    }

    return vectorizedDoc
  } catch (error) {
    console.error('Vectorization error:', error)
    throw new Error('Failed to vectorize document')
  }
}

function getContainerForType(type: string) {
  switch (type) {
    case 'coaching':
      return coachingContainer
    case 'review':
      return reviewContainer
    case 'case':
      return casesContainer
    case 'provider':
      return providersContainer
    case 'child':
      return childrenContainer
    case 'caregiver':
      return caregiversContainer
    default:
      return null
  }
}

async function updateCaseMetadata(caseId: string) {
  try {
    // Get case data
    const { resource: caseData } = await casesContainer.item(caseId).read()
    if (!caseData) return

    // Get related documents
    const coachingSessions = await getRelatedDocuments(coachingContainer, caseId)
    const reviews = await getRelatedDocuments(reviewContainer, caseId)
    const children = await getRelatedDocuments(childrenContainer, caseId)
    const caregivers = await getRelatedDocuments(caregiversContainer, caseId)

    const metadata: CaseMetadata = {
      id: caseId,
      caseId,
      lastUpdated: new Date().toISOString(),
      documentCount: coachingSessions.length + reviews.length + children.length + caregivers.length,
      vectorCount: coachingSessions.length + reviews.length + children.length + caregivers.length,
    }

    // Store metadata in case document
    await casesContainer.item(caseId).patch([
      {
        op: 'add',
        path: '/metadata',
        value: metadata,
      },
    ])
  } catch (error) {
    console.error('Error updating case metadata:', error)
  }
}

async function getRelatedDocuments(container: any, caseId: string) {
  const { resources } = await container.items
    .query({
      query: 'SELECT * FROM c WHERE c.metadata.caseId = @caseId',
      parameters: [{ name: '@caseId', value: caseId }],
    })
    .fetchAll()
  return resources
}

export async function searchSimilarDocuments(
  query: string,
  options: {
    caseId?: string
    providerId?: string
    limit?: number
    threshold?: number
  } = {}
): Promise<VectorizedDocument[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await embeddings.embedQuery(query)

    // Search across all relevant containers
    const containers = [
      coachingContainer,
      reviewContainer,
      casesContainer,
      providersContainer,
      childrenContainer,
      caregiversContainer,
    ]

    const allResults: VectorizedDocument[] = []

    for (const container of containers) {
      const { resources } = await container.items
        .query({
          query: `
            SELECT TOP @limit c.*, 
            VectorDistance(c.embedding, @queryEmbedding) as similarity
            FROM c
            WHERE c.metadata.type = @type
            ${options.caseId ? 'AND c.metadata.caseId = @caseId' : ''}
            ${options.providerId ? 'AND c.metadata.providerId = @providerId' : ''}
            ORDER BY similarity DESC
          `,
          parameters: [
            { name: '@limit', value: options.limit || 5 },
            { name: '@queryEmbedding', value: queryEmbedding },
            { name: '@type', value: container.id.split('-')[0] },
            ...(options.caseId ? [{ name: '@caseId', value: options.caseId }] : []),
            ...(options.providerId ? [{ name: '@providerId', value: options.providerId }] : []),
          ],
        })
        .fetchAll()

      allResults.push(...resources)
    }

    // Sort all results by similarity
    allResults.sort((a: any, b: any) => a.similarity - b.similarity)

    // Apply limit and threshold
    const limitedResults = allResults.slice(0, options.limit || 5)
    if (options.threshold) {
      return limitedResults.filter((doc: any) => doc.similarity <= options.threshold!)
    }

    return limitedResults
  } catch (error) {
    console.error('Search error:', error)
    throw new Error('Failed to search similar documents')
  }
}

export async function getContextForCase(
  caseId: string,
  query: string,
  options: {
    limit?: number
    threshold?: number
  } = {}
): Promise<{
  documents: VectorizedDocument[]
  summary: string
}> {
  try {
    // Get relevant documents
    const documents = await searchSimilarDocuments(query, {
      caseId,
      limit: options.limit,
      threshold: options.threshold,
    })

    // Create summary prompt template
    const summaryPrompt = PromptTemplate.fromTemplate(`
      Based on the following case documents, provide a concise summary relevant to the query: "{query}"
      
      Documents:
      {documents}
      
      Provide a summary that:
      1. Highlights key points relevant to the query
      2. Identifies patterns or trends
      3. Notes any concerns or areas needing attention
      4. Suggests potential next steps
    `)

    // Create summary chain
    const summaryChain = RunnableSequence.from([
      summaryPrompt,
      chatModel,
      new StringOutputParser(),
    ])

    // Generate summary
    const summary = await summaryChain.invoke({
      query,
      documents: documents.map((doc, i) => `
        Document ${i + 1}:
        ${doc.content}
        Type: ${doc.metadata.type}
        Date: ${doc.metadata.timestamp}
      `).join('\n'),
    })

    // Update case metadata with new summary
    await casesContainer.item(caseId).patch([
      {
        op: 'add',
        path: '/summary',
        value: summary,
      },
    ])

    return {
      documents,
      summary,
    }
  } catch (error) {
    console.error('Context retrieval error:', error)
    throw new Error('Failed to get case context')
  }
}

export async function generateRecommendations(
  caseId: string,
  context: {
    documents: VectorizedDocument[]
    summary: string
    rubric?: {
      name: string
      content: string
    }
  }
): Promise<{
  recommendations: Array<{
    type: 'approach' | 'resource' | 'warning' | 'rubric_evaluation'
    title: string
    description: string
    confidence: number
    source: string
  }>
}> {
  try {
    console.log('Generating recommendations with context:', {
      hasRubric: !!context.rubric,
      rubricName: context.rubric?.name,
      rubricContent: context.rubric?.content
    })

    // Create recommendations prompt template
    const recommendationsPrompt = PromptTemplate.fromTemplate(`
      Based on the following case context, generate specific recommendations for the caseworker.
      
      Case Summary:
      {summary}
      
      Recent Documents:
      {documents}
      
      ${context.rubric ? `
      Evaluation Rubric:
      Name: ${context.rubric.name}
      Content: ${context.rubric.content}
      
      REQUIRED: You MUST include a rubric_evaluation recommendation that evaluates the provider against this rubric.
      The rubric_evaluation should be the first recommendation in the array.
      
      For the rubric evaluation:
      1. Break down the evaluation by each section in the rubric
      2. For each section, provide:
         - A numerical grade (0-100)
         - Specific evidence from the provider's performance
         - Areas for improvement
      3. End with an overall grade and summary
      ` : ''}
      
      Generate recommendations that:
      1. If a rubric is provided, FIRST evaluate the provider against the rubric criteria (REQUIRED)
      2. Suggest specific approaches or strategies
      3. Identify relevant resources or services
      4. Highlight potential concerns or warnings
      5. Include confidence levels and sources
      
      Return ONLY a JSON object with the following structure, no markdown formatting or additional text:
      {{
        "recommendations": [
          {{
            "type": "rubric_evaluation" | "approach" | "resource" | "warning",
            "title": "string",
            "description": "string",
            "confidence": number (0-1),
            "source": "string",
            "sections": [
              {{
                "name": "string",
                "grade": number (0-100),
                "evidence": "string",
                "improvements": "string"
              }}
            ],
            "overallGrade": number (0-100)
          }}
        ]
      }}
    `)

    // Create recommendations chain
    const recommendationsChain = RunnableSequence.from([
      recommendationsPrompt,
      chatModel,
      new StringOutputParser(),
    ])

    // Generate recommendations
    const recommendationsJson = await recommendationsChain.invoke({
      summary: context.summary,
      documents: context.documents.map((doc, i) => `
        Document ${i + 1}:
        ${doc.content}
        Type: ${doc.metadata.type}
        Date: ${doc.metadata.timestamp}
      `).join('\n'),
      rubric: context.rubric
    })

    // Clean the response to handle potential markdown formatting
    const cleanedJson = recommendationsJson
      .replace(/```json\n?/g, '') // Remove ```json
      .replace(/```\n?/g, '')     // Remove closing ```
      .trim()                     // Remove extra whitespace

    try {
      const recommendations = JSON.parse(cleanedJson)
      console.log('Generated recommendations:', recommendations)
      return recommendations
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.error('Raw response:', recommendationsJson)
      throw new Error('Failed to parse recommendations response')
    }
  } catch (error) {
    console.error('Recommendation generation error:', error)
    throw new Error('Failed to generate recommendations')
  }
} 