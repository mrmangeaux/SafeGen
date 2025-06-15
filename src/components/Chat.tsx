'use client';

import { useState, useEffect } from 'react';
import { listAgents, sendMessage } from '@/lib/letta';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await listAgents();
        setAgents(data);
        if (data.length > 0) {
          setSelectedAgent(data[0].id);
        }
      } catch (err) {
        setError('Failed to load agents');
        console.error('Error loading agents:', err);
      }
    };

    fetchAgents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedAgent) return;

    const userMessage: Message = { role: 'user', content: input };
    console.log('Adding user message:', userMessage);
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      let assistantMessage = '';
      await sendMessage(selectedAgent, input, (chunk) => {
        console.log('Received chunk from Letta:', chunk);
        if (chunk.content) {
          assistantMessage = chunk.content;
          console.log('Updating messages with:', assistantMessage);
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'assistant') {
              lastMessage.content = assistantMessage;
            } else {
              newMessages.push({ role: 'assistant', content: assistantMessage });
            }
            console.log('New messages state:', newMessages);
            return newMessages;
          });
        }
      });
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <div className="mb-4">
        <label htmlFor="agent" className="block text-sm font-medium text-gray-700">
          Select Agent
        </label>
        <select
          id="agent"
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">Select an agent</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-100 ml-auto'
                : 'bg-gray-100'
            } max-w-[80%]`}
          >
            {message.content}
          </div>
        ))}
        {isLoading && (
          <div className="text-gray-500 text-center">Thinking...</div>
        )}
        {error && (
          <div className="text-red-500 text-center">{error}</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading || !selectedAgent}
        />
        <button
          type="submit"
          disabled={isLoading || !selectedAgent}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
} 