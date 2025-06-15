export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentState {
  id: string;
  name: string;
  // Add other agent properties as needed
} 