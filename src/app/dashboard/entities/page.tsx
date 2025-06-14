'use client';

import { EntityDashboard } from "@/components/EntityDashboard";
import { useEffect, useState } from "react";
import { Family, FamilyMember, Document, Goal, Note } from "@/types";

export default function EntitiesPage() {
  const [cases, setCases] = useState<Family[]>([]);
  const [children, setChildren] = useState<FamilyMember[]>([]);
  const [caregivers, setCaregivers] = useState<FamilyMember[]>([]);
  const [parents, setParents] = useState<FamilyMember[]>([]);
  const [providers, setProviders] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all entities in parallel
        const [casesRes, childrenRes, caregiversRes, parentsRes, providersRes] = await Promise.all([
          fetch('/api/cases'),
          fetch('/api/children'),
          fetch('/api/caregivers'),
          fetch('/api/parents'),
          fetch('/api/providers')
        ]);

        const [casesData, childrenData, caregiversData, parentsData, providersData] = await Promise.all([
          casesRes.json(),
          childrenRes.json(),
          caregiversRes.json(),
          parentsRes.json(),
          providersRes.json()
        ]);

        setCases(casesData);
        setChildren(childrenData);
        setCaregivers(caregiversData);
        setParents(parentsData);
        setProviders(providersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Entity Management</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Entity Management</h1>
      <EntityDashboard
        cases={cases}
        children={children}
        caregivers={caregivers}
        parents={parents}
        providers={providers}
      />
    </div>
  );
} 