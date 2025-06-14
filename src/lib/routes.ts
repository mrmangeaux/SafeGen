export const routes = {
  providers: {
    list: '/api/providers',
    get: (id: string) => `/api/providers/${id}`,
    create: '/api/providers',
    update: (id: string) => `/api/providers/${id}`,
    delete: (id: string) => `/api/providers/${id}`,
    context: (id: string) => `/api/providers/${id}/context`,
    comprehensiveContext: (id: string) => `/api/providers/${id}/comprehensive-context`,
    reviews: (id: string) => `/api/providers/${id}/reviews`,
    createReview: (id: string) => `/api/providers/${id}/reviews`,
  },
} 