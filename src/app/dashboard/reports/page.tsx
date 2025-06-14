'use client'

import { useState } from 'react'
import {
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'

interface ReportMetric {
  name: string
  value: string
  change: string
  changeType: 'positive' | 'negative'
  icon: any
}

const metrics: ReportMetric[] = [
  {
    name: 'Active Cases',
    value: '24',
    change: '+4.75%',
    changeType: 'positive',
    icon: UserGroupIcon,
  },
  {
    name: 'Documents Processed',
    value: '156',
    change: '+12.5%',
    changeType: 'positive',
    icon: DocumentTextIcon,
  },
  {
    name: 'Average Response Time',
    value: '2.4h',
    change: '-0.5h',
    changeType: 'positive',
    icon: ClockIcon,
  },
  {
    name: 'Goal Completion Rate',
    value: '78%',
    change: '+3.2%',
    changeType: 'positive',
    icon: ChartBarIcon,
  },
]

const reportTypes = [
  {
    id: 'case-summary',
    name: 'Case Summary Report',
    description: 'Overview of all active cases and their current status',
    icon: UserGroupIcon,
  },
  {
    id: 'document-analysis',
    name: 'Document Analysis Report',
    description: 'Analysis of document types, processing times, and trends',
    icon: DocumentTextIcon,
  },
  {
    id: 'performance-metrics',
    name: 'Performance Metrics Report',
    description: 'Key performance indicators and response time analysis',
    icon: ClockIcon,
  },
  {
    id: 'goal-tracking',
    name: 'Goal Tracking Report',
    description: 'Progress tracking and goal completion statistics',
    icon: ChartBarIcon,
  },
]

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('last30days')

  const handleGenerateReport = async (reportId: string) => {
    // TODO: Implement report generation
    console.log(`Generating report: ${reportId} for ${dateRange}`)
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
          <p className="mt-2 text-sm text-gray-700">
            Generate and view detailed reports about case management, document processing, and performance metrics.
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
          >
            <dt>
              <div className="absolute rounded-md bg-primary-500 p-3">
                <metric.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">
                {metric.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  metric.changeType === 'positive'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {metric.change}
              </p>
            </dd>
          </div>
        ))}
      </div>

      {/* Report Generation */}
      <div className="mt-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-lg font-medium text-gray-900">Generate Reports</h2>
            <p className="mt-2 text-sm text-gray-700">
              Select a report type and date range to generate detailed analytics.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6"
            >
              <option value="last7days">Last 7 days</option>
              <option value="last30days">Last 30 days</option>
              <option value="last90days">Last 90 days</option>
              <option value="thisYear">This year</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reportTypes.map((report) => (
            <div
              key={report.id}
              className="relative flex flex-col rounded-lg border border-gray-300 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center">
                <div className="rounded-md bg-primary-100 p-2">
                  <report.icon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                </div>
                <h3 className="ml-3 text-base font-semibold text-gray-900">
                  {report.name}
                </h3>
              </div>
              <p className="mt-2 text-sm text-gray-500">{report.description}</p>
              <div className="mt-4 flex flex-1 items-end">
                <button
                  type="button"
                  onClick={() => handleGenerateReport(report.id)}
                  className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                >
                  <ArrowDownTrayIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  Generate Report
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 