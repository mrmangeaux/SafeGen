'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Star, 
  Clock, 
  FileText,
  Calendar as CalendarIcon,
  Plus
} from 'lucide-react'

interface Provider {
  id: string
  name: string
  email: string
  phone: string
  address: string
  specialties: string[]
  rating: number
  status: string
  lastActive: string
  documents: any[]
}

interface Case {
  id: string
  title: string
  status: string
  priority: string
  assignedTo: string[]
  documents: any[]
  lastUpdated: string
}

interface Review {
  id: string
  rating: number
  comment: string
  date: string
  reviewer: string
}

interface Document {
  id: string
  title: string
  type: string
  status: string
  lastUpdated: string
}

export default function ProviderPage() {
  const params = useParams()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [cases, setCases] = useState<Case[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProviderContext = async () => {
      try {
        const response = await fetch(`/api/providers/${params.id}/context`)
        if (!response.ok) {
          throw new Error('Failed to fetch provider context')
        }
        const data = await response.json()
        setProvider(data.provider)
        setCases(data.cases)
        setReviews(data.reviews)
        setDocuments(data.documents)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchProviderContext()
  }, [params.id])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!provider) {
    return <div>Provider not found</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Provider Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{provider.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={provider.status === 'active' ? 'default' : 'secondary'}>
                {provider.status}
              </Badge>
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="ml-1">{provider.rating.toFixed(1)}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>{provider.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>{provider.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{provider.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-500" />
                <div className="flex flex-wrap gap-1">
                  {provider.specialties.map((specialty, index) => (
                    <Badge key={index} variant="outline">{specialty}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>Last active: {new Date(provider.lastActive).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="cases">
            <TabsList>
              <TabsTrigger value="cases">Cases</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            {/* Cases Tab */}
            <TabsContent value="cases">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Cases</CardTitle>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      New Case
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {cases.map((case_) => (
                        <Card key={case_.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold">{case_.title}</h3>
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="outline">{case_.status}</Badge>
                                  <Badge variant="outline">{case_.priority}</Badge>
                                </div>
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(case_.lastUpdated).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="mt-4">
                              <div className="text-sm text-gray-500">Assigned To:</div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {case_.assignedTo.map((assignee, index) => (
                                  <Badge key={index} variant="secondary">{assignee}</Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <CardTitle>Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <Card key={review.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                  <span className="font-semibold">{review.rating.toFixed(1)}</span>
                                </div>
                                <p className="mt-2 text-gray-600">{review.comment}</p>
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(review.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                              By {review.reviewer}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Documents</CardTitle>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {documents.map((doc) => (
                        <Card key={doc.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-gray-500" />
                                  <h3 className="font-semibold">{doc.title}</h3>
                                </div>
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="outline">{doc.type}</Badge>
                                  <Badge variant="outline">{doc.status}</Badge>
                                </div>
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(doc.lastUpdated).toLocaleDateString()}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 