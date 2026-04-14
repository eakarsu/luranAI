'use client'

import { useState, useEffect } from 'react'
import StatusBadge from '@/components/ui/StatusBadge'

interface OrgMember {
  id: string
  role: string
  user: { id: string; name: string; email: string }
}

interface Organization {
  id: string
  name: string
  slug: string
  industry: string | null
  plan: string
  brandName: string | null
  primaryColor: string
  createdAt: string
  members: OrgMember[]
  _count: {
    voiceAgents: number
    chatAgents: number
    emailAgents: number
    contacts: number
    conversations: number
    integrations: number
  }
}

export default function OrganizationPage() {
  const [org, setOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('member')
  const [addError, setAddError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editIndustry, setEditIndustry] = useState('')

  useEffect(() => {
    fetchOrg()
  }, [])

  async function fetchOrg() {
    try {
      const res = await fetch('/api/organizations')
      const orgs = await res.json()
      if (orgs.length > 0) {
        const detailRes = await fetch(`/api/organizations/${orgs[0].id}`)
        const detail = await detailRes.json()
        setOrg(detail)
        setEditName(detail.name)
        setEditIndustry(detail.industry || '')
      }
    } catch {
      // no org yet
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault()
    const slug = editName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const res = await fetch('/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, slug, industry: editIndustry || null }),
    })
    if (res.ok) {
      await fetchOrg()
      setEditing(false)
    }
  }

  async function handleUpdateOrg() {
    if (!org) return
    const res = await fetch(`/api/organizations/${org.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, industry: editIndustry || null }),
    })
    if (res.ok) {
      await fetchOrg()
      setEditing(false)
    }
  }

  async function handleAddMember() {
    if (!org) return
    setAddError(null)
    const res = await fetch(`/api/organizations/${org.id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newMemberEmail, role: newMemberRole }),
    })
    if (res.ok) {
      setNewMemberEmail('')
      setShowAddMember(false)
      await fetchOrg()
    } else {
      const data = await res.json()
      setAddError(data.error)
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!org) return
    await fetch(`/api/organizations/${org.id}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    await fetchOrg()
  }

  const inputClassName = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Organization</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
          <div className="h-4 bg-gray-100 rounded w-full mb-2" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    )
  }

  if (!org) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Organization</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-lg">
          <p className="text-gray-600 mb-6">Set up your organization to enable multi-tenant features, team management, and white-label branding.</p>
          <form onSubmit={handleCreateOrg} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={inputClassName}
                placeholder="My Dental Practice"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <select
                value={editIndustry}
                onChange={(e) => setEditIndustry(e.target.value)}
                className={inputClassName}
              >
                <option value="">Select industry...</option>
                <option value="dentistry">Dentistry</option>
                <option value="restaurants">Restaurants</option>
                <option value="health-clinics">Health Clinics</option>
                <option value="real-estate">Real Estate</option>
                <option value="car-dealerships">Car Dealerships</option>
                <option value="hospitality">Hospitality</option>
                <option value="insurance">Insurance</option>
                <option value="legal">Legal</option>
                <option value="home-services">Home Services</option>
                <option value="fitness">Fitness</option>
                <option value="salon-spa">Salon & Spa</option>
                <option value="education">Education</option>
                <option value="accounting-tax">Accounting & Tax</option>
                <option value="auto-repair">Auto Repair</option>
                <option value="pet-care">Pet Care</option>
                <option value="pharmacy">Pharmacy</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Create Organization
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Organization</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your organization, team members, and settings</p>
      </div>

      <div className="space-y-6">
        {/* Org Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Details</h2>
              <p className="text-xs text-gray-500 mt-0.5">Organization information</p>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>
          <div className="p-6">
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClassName} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <input type="text" value={editIndustry} onChange={(e) => setEditIndustry(e.target.value)} className={inputClassName} />
                </div>
                <button onClick={handleUpdateOrg} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium">
                  Save Changes
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{org.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Slug</p>
                  <p className="font-medium text-gray-900">{org.slug}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Plan</p>
                  <StatusBadge status={org.plan} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Industry</p>
                  <p className="font-medium text-gray-900 capitalize">{org.industry || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium text-gray-900">{new Date(org.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Usage Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Usage</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {[
                { label: 'Voice Agents', count: org._count.voiceAgents },
                { label: 'Chat Agents', count: org._count.chatAgents },
                { label: 'Email Agents', count: org._count.emailAgents },
                { label: 'Contacts', count: org._count.contacts },
                { label: 'Conversations', count: org._count.conversations },
                { label: 'Integrations', count: org._count.integrations },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold text-primary-600">{stat.count}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
              <p className="text-xs text-gray-500 mt-0.5">{org.members.length} member{org.members.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 text-sm font-medium"
            >
              Add Member
            </button>
          </div>
          <div className="p-6">
            {showAddMember && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="user@example.com"
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button onClick={handleAddMember} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium">
                    Add
                  </button>
                </div>
                {addError && <p className="text-sm text-red-600 mt-2">{addError}</p>}
              </div>
            )}
            <div className="space-y-3">
              {org.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-medium text-sm">
                        {member.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                      <p className="text-xs text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      member.role === 'owner' ? 'bg-amber-100 text-amber-700' :
                      member.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {member.role}
                    </span>
                    {member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.user.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
