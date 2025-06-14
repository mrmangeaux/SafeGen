import { BlobServiceClient } from '@azure/storage-blob'
import { CosmosClient } from '@azure/cosmos'
import { OpenAIClient } from '@azure/openai'

// Azure Blob Storage
export const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING!
)

export const uploadDocument = async (
  file: File,
  containerName: string
): Promise<string> => {
  const containerClient = blobServiceClient.getContainerClient(containerName)
  const blockBlobClient = containerClient.getBlockBlobClient(file.name)
  await blockBlobClient.uploadData(await file.arrayBuffer(), {
    blobHTTPHeaders: { blobContentType: file.type },
  })
  return blockBlobClient.url
}

// Azure Cosmos DB
export const cosmosClient = new CosmosClient({
  endpoint: process.env.AZURE_COSMOS_ENDPOINT!,
  key: process.env.AZURE_COSMOS_KEY!,
})

export const database = cosmosClient.database('safegen')
export const familiesContainer = database.container('families')
export const documentsContainer = database.container('documents')
export const goalsContainer = database.container('goals')
export const notesContainer = database.container('notes')

// Azure OpenAI
export const openAIClient = new OpenAIClient(
  process.env.AZURE_OPENAI_ENDPOINT!,
  {
    apiKey: process.env.AZURE_OPENAI_API_KEY!,
  }
)

export const generateCaseSummary = async (caseNotes: string[]): Promise<string> => {
  const prompt = `Please provide a concise summary of the following case notes:\n\n${caseNotes.join(
    '\n'
  )}`

  const response = await openAIClient.getChatCompletions(
    'gpt-4',
    [
      {
        role: 'system',
        content:
          'You are a child welfare case management assistant. Provide clear, professional summaries of case notes.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    {
      maxTokens: 500,
      temperature: 0.7,
    }
  )

  return response.choices[0].message?.content || 'Unable to generate summary.'
}

export const analyzeSentiment = async (text: string): Promise<{
  sentiment: 'positive' | 'negative' | 'neutral'
  score: number
}> => {
  const prompt = `Analyze the sentiment of the following text and provide a score from -1 (very negative) to 1 (very positive):\n\n${text}`

  const response = await openAIClient.getChatCompletions(
    'gpt-4',
    [
      {
        role: 'system',
        content:
          'You are a sentiment analysis assistant. Analyze text and provide sentiment scores.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    {
      maxTokens: 100,
      temperature: 0.3,
    }
  )

  const result = response.choices[0].message?.content || 'neutral 0'
  const [sentiment, score] = result.split(' ')

  return {
    sentiment: sentiment.toLowerCase() as 'positive' | 'negative' | 'neutral',
    score: parseFloat(score),
  }
} 