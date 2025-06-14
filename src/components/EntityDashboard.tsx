'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EntityDashboardProps {
  cases: any[];
  children: any[];
  caregivers: any[];
  parents: any[];
  providers: any[];
}

export function EntityDashboard({
  cases,
  children,
  caregivers,
  parents,
  providers,
}: EntityDashboardProps) {
  const [selectedEntityType, setSelectedEntityType] = useState<string>('child');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');

  const getEntityOptions = () => {
    switch (selectedEntityType) {
      case 'child':
        return children.map(child => ({
          id: child.id,
          name: child.name,
          age: child.age
        }));
      case 'caregiver':
        return caregivers.map(caregiver => ({
          id: caregiver.id,
          name: caregiver.name,
          type: caregiver.type
        }));
      case 'parent':
        return parents.map(parent => ({
          id: parent.id,
          name: parent.name,
          status: parent.status
        }));
      case 'provider':
        return providers.map(provider => ({
          id: provider.id,
          name: provider.name,
          role: provider.role
        }));
      default:
        return [];
    }
  };

  const getEntityDetails = () => {
    if (!selectedEntityId) return null;

    const entityCases = cases.filter(case_ => {
      switch (selectedEntityType) {
        case 'child':
          return case_.family.children.includes(selectedEntityId);
        case 'caregiver':
          return case_.family.caregivers.includes(selectedEntityId);
        case 'parent':
          return case_.family.parents.mother?.id === selectedEntityId || 
                 case_.family.parents.father?.id === selectedEntityId;
        case 'provider':
          return case_.services.providers.includes(selectedEntityId);
        default:
          return false;
      }
    });

    return {
      cases: entityCases,
    };
  };

  const renderEntityDetails = () => {
    const details = getEntityDetails();
    if (!details) return null;

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Case History</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {details.cases.map((case_: any) => (
                <div key={case_.id} className="mb-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{case_.id}</h3>
                    <Badge variant={case_.status === 'active' ? 'default' : 'secondary'}>
                      {case_.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {case_.type.replace('_', ' ').toUpperCase()}
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Start Date:</span> {case_.startDate}
                    </p>
                    {case_.endDate && (
                      <p className="text-sm">
                        <span className="font-medium">End Date:</span> {case_.endDate}
                      </p>
                    )}
                    <p className="text-sm">
                      <span className="font-medium">Outcome:</span> {case_.outcome || 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Tabs defaultValue="timeline">
          <TabsList>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  {details.cases.flatMap((case_: any) => 
                    case_.timeline.map((event: any) => (
                      <div key={`${case_.id}-${event.date}`} className="mb-2 p-2 border-l-2 border-primary">
                        <p className="text-sm font-medium">{event.date}</p>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  {details.cases.flatMap((case_: any) => 
                    case_.documents.map((doc: any) => (
                      <div key={doc.id} className="mb-2 p-2 border rounded">
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Type: {doc.type} | Date: {doc.date}
                        </p>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  {details.cases.flatMap((case_: any) => 
                    case_.notes.map((note: any) => (
                      <div key={`${case_.id}-${note.date}`} className="mb-2 p-2 border rounded">
                        <p className="text-sm font-medium">{new Date(note.date).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">{note.content}</p>
                        <p className="text-xs text-muted-foreground">By: {note.author}</p>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Select
          value={selectedEntityType}
          onValueChange={(value) => {
            setSelectedEntityType(value);
            setSelectedEntityId(''); // Reset selected entity when type changes
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="child">Children</SelectItem>
            <SelectItem value="caregiver">Caregivers</SelectItem>
            <SelectItem value="parent">Parents</SelectItem>
            <SelectItem value="provider">Providers</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={selectedEntityId}
          onValueChange={setSelectedEntityId}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select entity" />
          </SelectTrigger>
          <SelectContent>
            {getEntityOptions().map((entity) => (
              <SelectItem key={entity.id} value={entity.id}>
                {entity.name}
                {entity.age && ` (${entity.age} years)`}
                {entity.type && ` - ${entity.type}`}
                {entity.role && ` - ${entity.role}`}
                {entity.status && ` - ${entity.status}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedEntityId && renderEntityDetails()}
    </div>
  );
} 