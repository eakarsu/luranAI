'use client'

import { useState, useEffect } from 'react'
import DataTable from '@/components/ui/DataTable'

interface Template {
  id: string
  name: string
  type: string
  content: string
  industry: string | null
  category: string | null
}

const typeColors: Record<string, string> = {
  SMS: 'bg-blue-100 text-blue-800',
  EMAIL: 'bg-orange-100 text-orange-800',
  CHAT: 'bg-green-100 text-green-800',
  VOICE: 'bg-purple-100 text-purple-800',
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/templates')
        if (!res.ok) throw new Error('Failed to fetch templates')
        const data = await res.json()
        setTemplates(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
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
        <p className="font-medium">Error loading templates</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  const columns = [
    { key: 'name' as const, label: 'Name' },
    {
      key: 'type' as const,
      label: 'Type',
      render: (template: Template) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[template.type] || 'bg-gray-100 text-gray-800'}`}>
          {template.type}
        </span>
      ),
    },
    {
      key: 'industry' as const,
      label: 'Industry',
      render: (template: Template) => (
        <span className="text-sm text-gray-600">{template.industry || '-'}</span>
      ),
    },
    {
      key: 'category' as const,
      label: 'Category',
      render: (template: Template) => (
        <span className="text-sm text-gray-600">{template.category || '-'}</span>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={templates}
      basePath="/templates"
      title="Templates"
      searchField="name"
    />
  )
}
