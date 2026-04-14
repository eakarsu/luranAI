'use client'

import { useState, useEffect } from 'react'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'

interface SmsCampaign {
  id: string
  name: string
  audience: string
  status: string
  sent: number
  delivered: number
  responses: number
  industry: string
}

export default function SmsCampaignsPage() {
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const res = await fetch('/api/sms-campaigns')
        if (!res.ok) throw new Error('Failed to fetch SMS campaigns')
        const data = await res.json()
        setCampaigns(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchCampaigns()
  }, [])

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <p className="font-medium">Error loading SMS campaigns</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  const columns = [
    { key: 'name' as const, label: 'Name' },
    { key: 'audience' as const, label: 'Audience' },
    {
      key: 'status' as const,
      label: 'Status',
      render: (campaign: SmsCampaign) => <StatusBadge status={campaign.status} />,
    },
    { key: 'sent' as const, label: 'Sent' },
    { key: 'delivered' as const, label: 'Delivered' },
    { key: 'responses' as const, label: 'Responses' },
    { key: 'industry' as const, label: 'Industry' },
  ]

  return (
    <DataTable
      columns={columns}
      data={campaigns}
      basePath="/sms-campaigns"
      title="SMS Campaigns"
      searchField="name"
    />
  )
}
