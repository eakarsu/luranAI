'use client'

import { useState, useEffect } from 'react'
import DataTable from '@/components/ui/DataTable'

interface KnowledgeBaseItem {
  id: string
  title: string
  category: string
  industry: string
  tags: string[]
}

export default function KnowledgeBasePage() {
  const [items, setItems] = useState<KnowledgeBaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchItems() {
      try {
        const res = await fetch('/api/knowledge-base')
        if (!res.ok) throw new Error('Failed to fetch knowledge base')
        const data = await res.json()
        setItems(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
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
        <p className="font-medium">Error loading knowledge base</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  const columns = [
    { key: 'title' as const, label: 'Title' },
    { key: 'category' as const, label: 'Category' },
    { key: 'industry' as const, label: 'Industry' },
    {
      key: 'tags' as const,
      label: 'Tags',
      render: (item: KnowledgeBaseItem) => {
        const tags = Array.isArray(item.tags) ? item.tags : []
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-gray-400">+{tags.length - 3}</span>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={items}
      basePath="/knowledge-base"
      title="Knowledge Base"
      searchField="title"
    />
  )
}
