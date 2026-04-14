'use client'

import { useState, useEffect } from 'react'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  company: string | null
  industry: string | null
  status: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContacts() {
      try {
        const res = await fetch('/api/contacts')
        if (!res.ok) throw new Error('Failed to fetch contacts')
        const data = await res.json()
        setContacts(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchContacts()
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
        <p className="font-medium">Error loading contacts</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  const columns = [
    { key: 'firstName' as const, label: 'First Name' },
    { key: 'lastName' as const, label: 'Last Name' },
    { key: 'email' as const, label: 'Email' },
    { key: 'phone' as const, label: 'Phone' },
    { key: 'company' as const, label: 'Company' },
    { key: 'industry' as const, label: 'Industry' },
    {
      key: 'status' as const,
      label: 'Status',
      render: (contact: Contact) => <StatusBadge status={contact.status} />,
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={contacts}
      basePath="/contacts"
      title="Contacts"
      searchField="firstName"
    />
  )
}
