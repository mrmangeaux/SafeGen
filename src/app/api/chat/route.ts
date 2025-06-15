import { NextResponse } from 'next/server'
import { getCosmosClient } from '@/lib/cosmos'
import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import { getContextForProvider } from '@/lib/vectorization'

// Initialize LangChain models
const chatModel = new ChatOpenAI({
  openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { providerId, message } = body

    if (!providerId || !message) {
      console.log("providerId")
      console.log(providerId)
      console.log(message)
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      )
    }

    // Get context for the provider's entire caseload
    const context = await getContextForProvider(providerId, message, {
      limit: 5,
      threshold: 0.8
    })

    // Generate response using LangChain
    const chatPrompt = PromptTemplate.fromTemplate(`
      You are a helpful assistant for child welfare case workers. You have access to the following context about the provider's entire caseload:

      Provider Summary:
      {summary}

      Provider's Cases:
      {caseContexts}

      Provider Documents:
      {documents}

      The provider asks: {message}

      Provide a thoughtful, informed response that:
      1. Considers patterns and insights across their entire caseload
      2. Offers practical, actionable advice for managing multiple cases
      3. Maintains a professional and supportive tone
      4. Focuses on child safety and well-being
      5. Considers cultural sensitivity and family strengths
      6. Takes into account the provider's experience and previous interactions
      7. Helps identify opportunities for cross-case learning and improvement
      8. Suggests strategies that could be applied across cases

      Response:
    `)

    const chatChain = RunnableSequence.from([
      chatPrompt,
      chatModel,
      new StringOutputParser(),
    ])

    const response = await chatChain.invoke({
      summary: context.summary,
      caseContexts: context.caseContexts.map(ctx => `
        Case: ${ctx.familyName}
        Summary: ${ctx.summary}
        Context: ${ctx.context}
      `).join('\n\n'),
      documents: context.documents.map((doc, i) => `
        Document ${i + 1}:
        ${doc.content}
        Type: ${doc.metadata.type}
        Date: ${doc.metadata.timestamp}
      `).join('\n'),
      message
    })

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 