'use client'

import AIResponseReport from '@/components/AIResponseReport'

interface AIResponseDisplayProps {
  response: unknown
  loading?: boolean
  title?: string
}

export default function AIResponseDisplay({ response, loading, title = 'AI Response' }: AIResponseDisplayProps) {
  if (loading) {
    return <div role="status" className="rounded-xl border border-primary-200 bg-primary-50 p-6 text-primary-700">AI is thinking...</div>
  }
  if (response === null) return null
  return <AIResponseReport value={response} title={title} />
}
