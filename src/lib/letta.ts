import { LettaClient } from '@letta-ai/letta-client';

const LETTA_BASE_URL = process.env.NEXT_PUBLIC_LETTA_API_URL || 'http://localhost:8283';

// Initialize the Letta client
const client = new LettaClient({
  baseUrl: LETTA_BASE_URL,
});

export async function listAgents() {
  try {
    console.log('Fetching agents from:', LETTA_BASE_URL);
    const agents = await client.agents.list();
    console.log('Received agents:', agents);
    return agents;
  } catch (error) {
    console.error('Error fetching agents:', error);
    throw error;
  }
}

export async function getAgent(agentId: string) {
  try {
    return await client.agents.retrieve(agentId);
  } catch (error) {
    console.error('Error fetching agent:', error);
    throw error;
  }
}

function extractMessageFromResponse(response: any): string {
  console.log('Extracting message from response:', response);
  // Find the function call message
  const functionCall = response.messages?.find((msg: any) => msg.message_type === 'function_call');
  console.log('Found function call:', functionCall);
  
  if (functionCall?.function_call?.arguments) {
    try {
      const args = JSON.parse(functionCall.function_call.arguments);
      console.log('Parsed arguments:', args);
      const message = args.message || '';
      console.log('Extracted message:', message);
      return message;
    } catch (e) {
      console.error('Error parsing function call arguments:', e);
      return '';
    }
  }
  return '';
}

export async function sendMessage(
  agentId: string,
  message: string,
  onChunk?: (chunk: any) => void
) {
  try {
    console.log('Sending message to agent:', agentId, message);
    
    const response = await fetch(`${LETTA_BASE_URL}/v1/agents/${agentId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            text: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('Raw API response:', data);

    const extractedMessage = extractMessageFromResponse(data);
    console.log('Extracted message for UI:', extractedMessage);
    
    const uiMessage = { content: extractedMessage };
    console.log('Sending to UI:', uiMessage);
    
    if (onChunk) {
      onChunk(uiMessage);
    }

    return uiMessage;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
}

export async function sendMessageStream(
  agentId: string,
  message: string,
  onChunk: (chunk: any) => void
) {
  try {
    const response = await fetch(`${LETTA_BASE_URL}/v1/agents/${agentId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            text: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('Stream response:', data);
    
    const extractedMessage = extractMessageFromResponse(data);
    onChunk({ content: extractedMessage });
  } catch (error) {
    console.error('Error in sendMessageStream:', error);
    throw error;
  }
}

export async function getMessages(agentId: string) {
  try {
    return await client.agents.messages.list(agentId);
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}