'use client'

import { useState, useEffect } from 'react'
import StatusBadge from '@/components/ui/StatusBadge'

interface VoiceAgent {
  id: string
  name: string
}

interface Contact {
  id: string
  firstName: string
  lastName: string
}

interface CallLog {
  id: string
  voiceAgentId: string
  voiceAgent: VoiceAgent
  contactId: string
  contact: Contact
  duration: number
  outcome: string
  recordingUrl: string | null
  transcript: string | null
  sentiment: string | null
  createdAt: string
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function CallLogsPage() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCallLogs() {
      try {
        const res = await fetch('/api/call-logs')
        if (!res.ok) throw new Error('Failed to fetch call logs')
        const data = await res.json()
        setCallLogs(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchCallLogs()
  }, [])

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Call Logs</h1>
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
        <p className="font-medium">Error loading call logs</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Call Logs</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Voice Agent</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Outcome</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sentiment</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {callLogs.map((log, i) => (
                <>
                  <tr
                    key={log.id}
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    className={`cursor-pointer hover:bg-primary-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap font-medium">
                      {log.voiceAgent?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {log.contact?.firstName} {log.contact?.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap font-mono">
                      {formatDuration(log.duration)}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <StatusBadge status={log.outcome} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {log.sentiment || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr key={`${log.id}-expanded`}>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Recording URL</p>
                            <p className="text-sm text-gray-700">
                              {log.recordingUrl ? (
                                <a href={log.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                                  Listen to Recording
                                </a>
                              ) : 'No recording available'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Full Details</p>
                            <div className="text-sm text-gray-700 space-y-1">
                              <p>Agent: {log.voiceAgent?.name}</p>
                              <p>Contact: {log.contact?.firstName} {log.contact?.lastName}</p>
                              <p>Duration: {formatDuration(log.duration)}</p>
                              <p>Date: {new Date(log.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                          {log.transcript && (
                            <div className="md:col-span-2">
                              <p className="text-sm text-gray-500 mb-1">Transcript</p>
                              <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                {log.transcript}
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {callLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No call logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-3 text-sm text-gray-500">{callLogs.length} record{callLogs.length !== 1 ? 's' : ''}</p>
    </div>
  )
}
