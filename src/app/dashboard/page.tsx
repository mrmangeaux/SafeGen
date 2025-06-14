'use client'

// Temporarily disabled auth for testing
// import { useSession } from 'next-auth/react'
import {
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const stats = [
  {
    name: 'Active Cases',
    value: '24',
    icon: UserGroupIcon,
    change: '+4.75%',
    changeType: 'positive',
  },
  {
    name: 'Documents Uploaded',
    value: '156',
    icon: DocumentTextIcon,
    change: '+12.5%',
    changeType: 'positive',
  },
  {
    name: 'Average Response Time',
    value: '2.4h',
    icon: ClockIcon,
    change: '-0.5h',
    changeType: 'positive',
  },
  {
    name: 'Goal Completion Rate',
    value: '78%',
    icon: ChartBarIcon,
    change: '+3.2%',
    changeType: 'positive',
  },
]

const recentActivity = [
  {
    id: 1,
    type: 'case_update',
    title: 'Case Update: Johnson Family',
    description: 'Progress report submitted for monthly review',
    date: '2 hours ago',
  },
  {
    id: 2,
    type: 'document_upload',
    title: 'New Document: Smith Family',
    description: 'Medical assessment report uploaded',
    date: '4 hours ago',
  },
  {
    id: 3,
    type: 'goal_completed',
    title: 'Goal Completed: Williams Family',
    description: 'Parenting class attendance goal achieved',
    date: '1 day ago',
  },
]

export default function Dashboard() {
  const router = useRouter();
  // Temporarily disabled auth for testing
  // const { data: session } = useSession()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, Test User
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's what's happening with your cases today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
          >
            <dt>
              <div className="absolute rounded-md bg-primary-500 p-3">
                <stat.icon
                  className="h-6 w-6 text-white"
                  aria-hidden="true"
                />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">
                {stat.value}
              </p>
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  stat.changeType === 'positive'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {stat.change}
              </p>
            </dd>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          <Button onClick={() => router.push('/reviews/new')}>
            Start Review
          </Button>
        </div>
        <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
          <ul role="list" className="divide-y divide-gray-200">
            {recentActivity.map((activity) => (
              <li key={activity.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {activity.description}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">{activity.date}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
} 