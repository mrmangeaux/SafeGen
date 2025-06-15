'use client';

import { useState, useEffect } from 'react';
import { listAgents } from '@/lib/letta';
import type { AgentState } from '@/types/letta';

interface AgentSelectorProps {
  onSelectAgent: (agentId: string) => void;
}

export default function AgentSelector({ onSelectAgent }: AgentSelectorProps) {
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        setError(null);
        const agentsList = await listAgents();
        console.log('Agents loaded:', agentsList);
        setAgents(agentsList);
      } catch (error) {
        console.error('Error loading agents:', error);
        setError(error instanceof Error ? error.message : 'Failed to load agents');
      } finally {
        setLoading(false);
      }
    };

    loadAgents();
  }, []);

  if (loading) {
    return <div>Loading agents...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500">
        <p>Error loading agents: {error}</p>
        <p className="text-sm">Please make sure your Letta server is running at {process.env.NEXT_PUBLIC_LETTA_API_URL || 'http://localhost:8000'}</p>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="text-yellow-500">
        <p>No agents found. Please create an agent in your Letta server first.</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700">Select Agent</label>
      <select
        onChange={(e) => onSelectAgent(e.target.value)}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
      >
        <option value="">Select an agent</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </select>
    </div>
  );
} 