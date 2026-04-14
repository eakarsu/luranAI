'use client'
import { useState } from 'react'

interface AIResponseDisplayProps {
  response: string | null
  loading?: boolean
  title?: string
}

export default function AIResponseDisplay({ response, loading, title = 'AI Response' }: AIResponseDisplayProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    if (response) {
      navigator.clipboard.writeText(response)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-primary-50 to-indigo-50 rounded-xl border border-primary-200 p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent" />
          <span className="text-primary-700 font-medium">AI is thinking...</span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-4 bg-primary-100 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-primary-100 rounded animate-pulse w-1/2" />
          <div className="h-4 bg-primary-100 rounded animate-pulse w-5/6" />
        </div>
      </div>
    )
  }

  if (!response) return null

  const sections = response.split('\n\n').filter(Boolean)

  return (
    <div className="bg-gradient-to-br from-primary-50 to-indigo-50 rounded-xl border border-primary-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 bg-primary-100/50 border-b border-primary-200">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="font-semibold text-primary-900">{title}</h3>
        </div>
        <button
          onClick={copyToClipboard}
          className="text-xs font-medium text-primary-600 hover:text-primary-800 px-3 py-1 rounded-md hover:bg-primary-100 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="p-6 space-y-4">
        {sections.map((section, i) => {
          const isHeading = section.startsWith('#') || section.startsWith('**') && section.endsWith('**')
          const isList = section.includes('\n- ') || section.includes('\n• ') || section.startsWith('- ') || section.startsWith('• ')

          if (isHeading) {
            const text = section.replace(/^#+\s*/, '').replace(/\*\*/g, '')
            return <h4 key={i} className="text-lg font-semibold text-gray-900 border-b border-primary-200 pb-2">{text}</h4>
          }

          if (isList) {
            const items = section.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
            return (
              <ul key={i} className="space-y-1.5">
                {items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-gray-700">
                    <span className="text-primary-500 mt-1.5 text-xs">●</span>
                    <span>{item.replace(/^[-•]\s*/, '').replace(/\*\*/g, '')}</span>
                  </li>
                ))}
              </ul>
            )
          }

          return (
            <p key={i} className="text-gray-700 leading-relaxed">
              {section.split('**').map((part, j) =>
                j % 2 === 1 ? <strong key={j} className="text-gray-900">{part}</strong> : part
              )}
            </p>
          )
        })}
      </div>
    </div>
  )
}
