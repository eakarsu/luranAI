'use client'

import { useState, useEffect } from 'react'
import StatusBadge from '@/components/ui/StatusBadge'
import Modal from '@/components/ui/Modal'

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
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    duration: 0,
    outcome: '',
    sentiment: '',
    recordingUrl: '',
    transcript: '',
  })

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

  function openLog(log: CallLog) {
    setSelectedLog(log)
    setIsEditing(false)
    setModalError(null)
    setEditForm({
      duration: log.duration,
      outcome: log.outcome,
      sentiment: log.sentiment || '',
      recordingUrl: log.recordingUrl || '',
      transcript: log.transcript || '',
    })
  }

  function closeLog() {
    setSelectedLog(null)
    setIsEditing(false)
    setSaving(false)
    setDeleting(false)
    setModalError(null)
  }

  async function saveLog() {
    if (!selectedLog) return
    setSaving(true)
    setModalError(null)
    try {
      const res = await fetch(`/api/call-logs/${selectedLog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: Number(editForm.duration) || 0,
          outcome: editForm.outcome,
          sentiment: editForm.sentiment || null,
          recordingUrl: editForm.recordingUrl || null,
          transcript: editForm.transcript || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to update call log')
      const updated = await res.json()
      setSelectedLog(updated)
      setCallLogs((prev) => prev.map((log) => log.id === updated.id ? updated : log))
      setIsEditing(false)
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to update call log')
    } finally {
      setSaving(false)
    }
  }

  async function deleteLog() {
    if (!selectedLog) return
    setDeleting(true)
    setModalError(null)
    try {
      const res = await fetch(`/api/call-logs/${selectedLog.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete call log')
      setCallLogs((prev) => prev.filter((log) => log.id !== selectedLog.id))
      closeLog()
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to delete call log')
      setDeleting(false)
    }
  }

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
                <tr
                  key={log.id}
                  onClick={() => openLog(log)}
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

      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={closeLog}
        title={selectedLog ? `Call Log: ${selectedLog.id}` : 'Call Log'}
        maxWidthClass="max-w-4xl"
      >
        {selectedLog && (
          <div className="space-y-4">
            {modalError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {modalError}
              </div>
            )}

            {isEditing ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Duration Seconds</span>
                  <input
                    type="number"
                    value={editForm.duration}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, duration: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Outcome</span>
                  <input
                    value={editForm.outcome}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, outcome: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Sentiment</span>
                  <input
                    value={editForm.sentiment}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, sentiment: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Recording URL</span>
                  <input
                    value={editForm.recordingUrl}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, recordingUrl: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Transcript</span>
                  <textarea
                    value={editForm.transcript}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, transcript: e.target.value }))}
                    rows={7}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  />
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Voice Agent</div>
                  <div className="mt-1 text-sm text-gray-900">{selectedLog.voiceAgent?.name || '-'}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Contact</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedLog.contact?.firstName} {selectedLog.contact?.lastName}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Duration</div>
                  <div className="mt-1 font-mono text-sm text-gray-900">{formatDuration(selectedLog.duration)}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Outcome</div>
                  <div className="mt-1 text-sm text-gray-900"><StatusBadge status={selectedLog.outcome} /></div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Sentiment</div>
                  <div className="mt-1 text-sm text-gray-900">{selectedLog.sentiment || '-'}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Date</div>
                  <div className="mt-1 text-sm text-gray-900">{new Date(selectedLog.createdAt).toLocaleString()}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 md:col-span-2">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Recording URL</div>
                  <div className="mt-1 break-words text-sm text-gray-900">
                    {selectedLog.recordingUrl ? (
                      <a href={selectedLog.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                        {selectedLog.recordingUrl}
                      </a>
                    ) : '-'}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 md:col-span-2">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Transcript</div>
                  <div className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words text-sm text-gray-900">
                    {selectedLog.transcript || '-'}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={deleteLog}
                disabled={deleting || saving}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={isEditing ? () => setIsEditing(false) : closeLog}
                  disabled={saving || deleting}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {isEditing ? 'Cancel' : 'Close'}
                </button>
                {isEditing ? (
                  <button
                    type="button"
                    onClick={saveLog}
                    disabled={saving || deleting}
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    disabled={deleting}
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
