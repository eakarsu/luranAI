'use client'

import { useState, useEffect } from 'react'
import StatusBadge from '@/components/ui/StatusBadge'

interface Integration {
  id: string
  name: string
  type: string
  provider: string
  status: string
  config: Record<string, unknown>
  lastSyncAt: string | null
  createdAt: string
}

interface Connector {
  id: string
  name: string
  provider: string
  type: string
  industry: string[]
  description: string
  features: string[]
  configFields: { key: string; label: string; type: string; placeholder: string; required: boolean }[]
  logoColor: string
}

const typeIcons: Record<string, string> = {
  crm: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  communication: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  payment: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  analytics: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  storage: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
  'practice-management': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  booking: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  automation: 'M13 10V3L4 14h7v7l9-11h-7z',
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [connectors, setConnectors] = useState<Connector[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'connected' | 'marketplace'>('marketplace')
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [configValues, setConfigValues] = useState<Record<string, string>>({})
  const [filterIndustry, setFilterIndustry] = useState<string>('')

  useEffect(() => {
    async function load() {
      try {
        const [intRes, connRes] = await Promise.all([
          fetch('/api/integrations'),
          fetch('/api/integrations/connectors'),
        ])
        setIntegrations(await intRes.json())
        setConnectors(await connRes.json())
      } catch {
        // handle error
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleConnect(connector: Connector) {
    const config: Record<string, string> = {}
    for (const field of connector.configFields) {
      config[field.key] = configValues[field.key] || ''
    }
    const res = await fetch('/api/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: connector.name,
        type: connector.type,
        provider: connector.provider,
        config,
        status: 'active',
      }),
    })
    if (res.ok) {
      const newIntegration = await res.json()
      setIntegrations((prev) => [newIntegration, ...prev])
      setConnectingId(null)
      setConfigValues({})
      setActiveTab('connected')
    }
  }

  async function handleDisconnect(id: string) {
    await fetch(`/api/integrations/${id}`, { method: 'DELETE' })
    setIntegrations((prev) => prev.filter((i) => i.id !== id))
  }

  const connectedProviders = integrations.map((i) => i.provider)
  const filteredConnectors = connectors.filter((c) =>
    !filterIndustry || c.industry.includes(filterIndustry)
  )

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Integrations</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="h-5 bg-gray-200 rounded w-32" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500 mt-1">Connect industry-specific tools and third-party services</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'marketplace' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Marketplace ({connectors.length})
        </button>
        <button
          onClick={() => setActiveTab('connected')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'connected' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Connected ({integrations.length})
        </button>
      </div>

      {activeTab === 'marketplace' && (
        <>
          {/* Industry Filter */}
          <div className="mb-6">
            <select
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Industries</option>
              <option value="dentistry">Dentistry</option>
              <option value="restaurants">Restaurants</option>
              <option value="health-clinics">Health Clinics</option>
              <option value="real-estate">Real Estate</option>
              <option value="car-dealerships">Car Dealerships</option>
              <option value="fitness">Fitness</option>
              <option value="salon-spa">Salon & Spa</option>
              <option value="legal">Legal</option>
              <option value="accounting-tax">Accounting & Tax</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConnectors.map((connector) => {
              const isConnected = connectedProviders.includes(connector.provider)
              const isConfiguring = connectingId === connector.id
              const iconPath = typeIcons[connector.type] || typeIcons.crm

              return (
                <div
                  key={connector.id}
                  className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-shadow hover:shadow-md ${
                    isConnected ? 'border-green-200' : 'border-gray-200'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: connector.logoColor + '15' }}>
                          <svg className="w-6 h-6" style={{ color: connector.logoColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{connector.name}</h3>
                          <p className="text-xs text-gray-500">{connector.provider}</p>
                        </div>
                      </div>
                      {isConnected && <StatusBadge status="active" />}
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{connector.description}</p>

                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {connector.industry.map((ind) => (
                          <span key={ind} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                            {ind.replace(/-/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>

                    {isConfiguring ? (
                      <div className="space-y-3 border-t border-gray-100 pt-4">
                        {connector.configFields.map((field) => (
                          <div key={field.key}>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            <input
                              type={field.type === 'password' ? 'password' : 'text'}
                              value={configValues[field.key] || ''}
                              onChange={(e) => setConfigValues({ ...configValues, [field.key]: e.target.value })}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder={field.placeholder}
                            />
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConnect(connector)}
                            className="flex-1 bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-700"
                          >
                            Connect
                          </button>
                          <button
                            onClick={() => { setConnectingId(null); setConfigValues({}) }}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-gray-100 pt-4">
                        <ul className="text-xs text-gray-500 space-y-1 mb-4">
                          {connector.features.slice(0, 3).map((f, i) => (
                            <li key={i} className="flex gap-1.5">
                              <svg className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {f}
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => isConnected ? null : setConnectingId(connector.id)}
                          disabled={isConnected}
                          className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isConnected
                              ? 'bg-green-50 text-green-700 cursor-default'
                              : 'bg-primary-600 text-white hover:bg-primary-700'
                          }`}
                        >
                          {isConnected ? 'Connected' : 'Configure'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {activeTab === 'connected' && (
        <>
          {integrations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <p className="text-gray-500 mb-2">No integrations connected yet</p>
              <button onClick={() => setActiveTab('marketplace')} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.map((integration) => {
                const iconPath = typeIcons[integration.type.toLowerCase()] || typeIcons.crm
                return (
                  <div key={integration.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                          <p className="text-xs text-gray-500">{integration.provider}</p>
                        </div>
                      </div>
                      <StatusBadge status={integration.status} />
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Type</span>
                        <span className="text-sm font-medium text-gray-700 capitalize">{integration.type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Last Sync</span>
                        <span className="text-sm text-gray-700">
                          {integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleString() : 'Never'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDisconnect(integration.id)}
                      className="w-full px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
