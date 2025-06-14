import { NextResponse } from 'next/server'
import { getCosmosClient } from '@/lib/cosmos'

export async function POST(request: Request) {
  console.log('Received recommendation generation request')
  
  try {
    const body = await request.json()
    console.log('Request body:', {
      providerId: body.provider?.id,
      selectedCaseIds: body.selectedCaseIds,
      totalCases: body.cases?.length,
      totalServices: body.services?.length,
      totalTasks: body.tasks?.length,
      totalNotes: body.notes?.length,
      totalReviews: body.reviews?.length
    })

    const { provider, cases, selectedCaseIds, services, tasks, notes, reviews } = body

    if (!provider || !cases || !selectedCaseIds) {
      console.error('Missing required data:', { 
        hasProvider: !!provider, 
        hasCases: !!cases, 
        hasSelectedCaseIds: !!selectedCaseIds 
      })
      return NextResponse.json(
        { message: 'Missing required data' },
        { status: 400 }
      )
    }

    console.log('Analyzing cases...')
    // Analyze all cases to identify patterns
    const successfulCases = cases.filter((c: any) => 
      c.status === 'completed' || c.status === 'successful'
    )
    const challengingCases = cases.filter((c: any) => 
      c.status === 'at_risk' || c.status === 'challenging'
    )

    console.log('Case analysis results:', {
      totalCases: cases.length,
      successfulCases: successfulCases.length,
      challengingCases: challengingCases.length,
      selectedCases: selectedCaseIds.length
    })

    // Generate recommendations based on analysis
    const recommendations = []

    // 1. Successful Case Patterns
    if (successfulCases.length > 0) {
      console.log('Generating recommendations from successful cases')
      const successfulPatterns = analyzeSuccessfulPatterns(successfulCases)
      recommendations.push(...successfulPatterns)
    }

    // 2. Risk Mitigation
    if (challengingCases.length > 0) {
      console.log('Generating risk mitigation recommendations')
      const riskMitigation = generateRiskMitigation(challengingCases)
      recommendations.push(...riskMitigation)
    }

    // 3. Case-Specific Strategies
    console.log('Generating case-specific strategies')
    const selectedCasesData = cases.filter((c: any) => selectedCaseIds.includes(c.id))
    const caseSpecificStrategies = generateCaseSpecificStrategies(selectedCasesData, successfulCases)
    recommendations.push(...caseSpecificStrategies)

    // 4. Service Delivery Optimization
    if (services && services.length > 0) {
      console.log('Generating service delivery recommendations')
      const serviceRecommendations = analyzeServiceDelivery(services, successfulCases)
      recommendations.push(...serviceRecommendations)
    }

    // 5. Documentation and Communication
    if (notes && notes.length > 0) {
      console.log('Generating documentation recommendations')
      const documentationRecommendations = analyzeDocumentation(notes, successfulCases)
      recommendations.push(...documentationRecommendations)
    }

    console.log('Generated recommendations:', {
      total: recommendations.length,
      byType: recommendations.reduce((acc: any, rec: any) => {
        acc[rec.type] = (acc[rec.type] || 0) + 1
        return acc
      }, {})
    })

    if (recommendations.length === 0) {
      console.log('No recommendations generated, creating default recommendations')
      recommendations.push({
        title: 'General Case Management',
        description: 'Focus on maintaining regular communication with families and documenting all interactions.',
        priority: 'high',
        category: 'case_management',
        source: 'default'
      })
    }

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json(
      { message: 'Failed to generate recommendations', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function analyzeSuccessfulPatterns(cases: any[]) {
  const patterns = new Set<string>()
  
  cases.forEach(case_ => {
    if (case_.communication) patterns.add('Regular communication with families')
    if (case_.documentation) patterns.add('Thorough documentation of all interactions')
    if (case_.followUp) patterns.add('Consistent follow-up on action items')
    if (case_.collaboration) patterns.add('Strong collaboration with other service providers')
  })

  return Array.from(patterns).map(pattern => ({
    title: 'Successful Case Pattern',
    description: pattern,
    priority: 'high',
    category: 'case_management',
    source: 'successful_cases'
  }))
}

function generateRiskMitigation(challengingCases: any[]) {
  const riskFactors = new Set<string>()
  
  challengingCases.forEach(case_ => {
    if (case_.communicationIssues) riskFactors.add('Communication gaps with families')
    if (case_.documentationIssues) riskFactors.add('Incomplete documentation')
    if (case_.followUpIssues) riskFactors.add('Inconsistent follow-up')
    if (case_.collaborationIssues) riskFactors.add('Limited collaboration with other providers')
  })

  return Array.from(riskFactors).map(factor => ({
    title: 'Risk Mitigation Strategy',
    description: `Address ${factor.toLowerCase()}`,
    priority: 'high',
    category: 'risk_management',
    source: 'challenging_cases'
  }))
}

function generateCaseSpecificStrategies(selectedCases: any[], successfulCases: any[]) {
  return selectedCases.flatMap(case_ => {
    const recommendations = []
    const similarSuccessfulCases = findSimilarCases(case_, successfulCases)
    
    if (similarSuccessfulCases.length > 0) {
      recommendations.push({
        title: `Case-Specific Strategy: ${case_.name}`,
        description: `Based on similar successful cases, focus on maintaining regular communication and thorough documentation.`,
        priority: 'high',
        category: 'case_specific',
        caseId: case_.id,
        source: 'similar_cases'
      })
    }

    return recommendations
  })
}

function analyzeServiceDelivery(services: any[], successfulCases: any[]) {
  return [{
    title: 'Service Delivery Optimization',
    description: 'Ensure timely service delivery and maintain clear communication with service providers.',
    priority: 'medium',
    category: 'service_delivery',
    source: 'service_patterns'
  }]
}

function analyzeDocumentation(notes: any[], successfulCases: any[]) {
  return [{
    title: 'Documentation and Communication',
    description: 'Maintain detailed documentation of all interactions and follow-ups.',
    priority: 'medium',
    category: 'documentation',
    source: 'documentation_patterns'
  }]
}

function findSimilarCases(case_: any, successfulCases: any[]) {
  return successfulCases.filter(successfulCase => 
    calculateSimilarityScore(case_, successfulCase) > 0.5
  )
}

function calculateSimilarityScore(case1: any, case2: any): number {
  let score = 0
  let totalFactors = 0

  // Compare case type
  if (case1.type === case2.type) {
    score += 1
    totalFactors++
  }

  // Compare child age range
  if (Math.abs(case1.childAge - case2.childAge) <= 2) {
    score += 1
    totalFactors++
  }

  // Compare needs
  const commonNeeds = case1.needs?.filter((need: string) => 
    case2.needs?.includes(need)
  ).length || 0
  score += commonNeeds / Math.max(case1.needs?.length || 1, case2.needs?.length || 1)
  totalFactors++

  // Compare challenges
  const commonChallenges = case1.challenges?.filter((challenge: string) => 
    case2.challenges?.includes(challenge)
  ).length || 0
  score += commonChallenges / Math.max(case1.challenges?.length || 1, case2.challenges?.length || 1)
  totalFactors++

  return totalFactors > 0 ? score / totalFactors : 0
} 