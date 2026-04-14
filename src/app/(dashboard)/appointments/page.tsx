'use client'

import { useState, useEffect } from 'react'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'

interface Contact {
  id: string
  firstName: string
  lastName: string
}

interface Appointment {
  id: string
  contactId: string
  contact: Contact
  dateTime: string
  type: string
  status: string
  reminderSent: boolean
  notes: string | null
  location: string | null
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const res = await fetch('/api/appointments')
        if (!res.ok) throw new Error('Failed to fetch appointments')
        const data = await res.json()
        setAppointments(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchAppointments()
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
        <p className="font-medium">Error loading appointments</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  const columns = [
    {
      key: 'contact' as const,
      label: 'Contact Name',
      render: (appt: Appointment) => (
        <span>{appt.contact?.firstName} {appt.contact?.lastName}</span>
      ),
    },
    {
      key: 'dateTime' as const,
      label: 'Date/Time',
      render: (appt: Appointment) => (
        <span>{new Date(appt.dateTime).toLocaleString()}</span>
      ),
    },
    { key: 'type' as const, label: 'Type' },
    {
      key: 'status' as const,
      label: 'Status',
      render: (appt: Appointment) => <StatusBadge status={appt.status} />,
    },
    {
      key: 'reminderSent' as const,
      label: 'Reminder Sent',
      render: (appt: Appointment) => (
        <span className={`text-sm font-medium ${appt.reminderSent ? 'text-green-600' : 'text-gray-400'}`}>
          {appt.reminderSent ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'location' as const,
      label: 'Location',
      render: (appt: Appointment) => (
        <span className="text-sm text-gray-600">{appt.location || '-'}</span>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={appointments}
      basePath="/appointments"
      title="Appointments"
      searchField="type"
    />
  )
}
