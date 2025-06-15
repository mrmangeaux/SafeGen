'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CoachingFlow } from '@/components/coaching/coaching-flow';
import { useToast } from '@/components/ui/use-toast';

interface Case {
  id: string;
  name: string;
  description: string;
  status: string;
}

export default function NewCoachingPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch('/api/cases');
        if (!response.ok) throw new Error('Failed to fetch cases');
        const data = await response.json();
        setCases(data);
      } catch (error) {
        console.error('Error fetching cases:', error);
        toast({
          title: 'Error',
          description: 'Failed to load cases',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCases();
  }, [toast]);

  const handleComplete = async (coaching: any) => {
    try {
      const response = await fetch('/api/coaching-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(coaching)
      });

      if (!response.ok) throw new Error('Failed to create coaching session');

      toast({
        title: 'Success',
        description: 'Coaching session created successfully'
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating coaching session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create coaching session',
        variant: 'destructive'
      });
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">New Coaching Session</h1>
      <CoachingFlow
        cases={cases}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  );
} 