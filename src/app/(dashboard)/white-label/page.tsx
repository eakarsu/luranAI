'use client'

import { useState, useEffect } from 'react'

interface BrandingConfig {
  id: string
  brandName: string | null
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  accentColor: string
  customDomain: string | null
  emailFrom: string | null
  supportEmail: string | null
  footerText: string | null
  loginMessage: string | null
}

export default function WhiteLabelPage() {
  const [orgId, setOrgId] = useState<string | null>(null)
  const [branding, setBranding] = useState<BrandingConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    brandName: '',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#4F46E5',
    accentColor: '#7C3AED',
    customDomain: '',
    emailFrom: '',
    supportEmail: '',
    footerText: '',
    loginMessage: '',
  })

  useEffect(() => {
    async function load() {
      try {
        const orgsRes = await fetch('/api/organizations')
        const orgs = await orgsRes.json()
        if (orgs.length > 0) {
          setOrgId(orgs[0].id)
          const res = await fetch(`/api/organizations/${orgs[0].id}/branding`)
          const data = await res.json()
          setBranding(data)
          setForm({
            brandName: data.brandName || '',
            logoUrl: data.logoUrl || '',
            faviconUrl: data.faviconUrl || '',
            primaryColor: data.primaryColor || '#4F46E5',
            accentColor: data.accentColor || '#7C3AED',
            customDomain: data.customDomain || '',
            emailFrom: data.emailFrom || '',
            supportEmail: data.supportEmail || '',
            footerText: data.footerText || '',
            loginMessage: data.loginMessage || '',
          })
        }
      } catch {
        // no org yet
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave() {
    if (!orgId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/organizations/${orgId}/branding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  const inputClassName = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">White Label</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
          <div className="space-y-3">
            <div className="h-10 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!orgId) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">White Label</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500 mb-4">Create an organization first to configure white-label branding.</p>
          <a href="/organization" className="text-primary-600 hover:text-primary-700 font-medium">
            Go to Organization Settings
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">White Label</h1>
        <p className="text-sm text-gray-500 mt-1">Customize branding to resell under your own brand or your clients brand</p>
      </div>

      <div className="space-y-6">
        {/* Brand Identity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Brand Identity</h2>
            <p className="text-xs text-gray-500 mt-0.5">Replace Luran AI branding with your own</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
              <input
                type="text"
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                className={inputClassName}
                placeholder="Your Brand Name"
              />
              <p className="text-xs text-gray-400 mt-1">Replaces &quot;Luran AI&quot; throughout the platform</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input
                  type="url"
                  value={form.logoUrl}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  className={inputClassName}
                  placeholder="https://your-domain.com/logo.png"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Favicon URL</label>
                <input
                  type="url"
                  value={form.faviconUrl}
                  onChange={(e) => setForm({ ...form, faviconUrl: e.target.value })}
                  className={inputClassName}
                  placeholder="https://your-domain.com/favicon.ico"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Colors</h2>
            <p className="text-xs text-gray-500 mt-0.5">Customize the color scheme</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.primaryColor}
                    onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                    className={inputClassName}
                    placeholder="#4F46E5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={form.accentColor}
                    onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.accentColor}
                    onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                    className={inputClassName}
                    placeholder="#7C3AED"
                  />
                </div>
              </div>
            </div>
            {/* Preview */}
            <div className="mt-6 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500 mb-3">Preview</p>
              <div className="flex gap-3">
                <div className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: form.primaryColor }}>
                  Primary Button
                </div>
                <div className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: form.accentColor }}>
                  Accent Button
                </div>
                <div className="px-4 py-2 rounded-lg border-2 text-sm font-medium" style={{ borderColor: form.primaryColor, color: form.primaryColor }}>
                  Outline Button
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Domain */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Custom Domain</h2>
            <p className="text-xs text-gray-500 mt-0.5">Serve the platform from your own domain</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
              <input
                type="text"
                value={form.customDomain}
                onChange={(e) => setForm({ ...form, customDomain: e.target.value })}
                className={inputClassName}
                placeholder="app.yourdomain.com"
              />
              <p className="text-xs text-gray-400 mt-1">Point a CNAME record to app.luranai.com</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Login Page Message</label>
              <input
                type="text"
                value={form.loginMessage}
                onChange={(e) => setForm({ ...form, loginMessage: e.target.value })}
                className={inputClassName}
                placeholder="Welcome to Your Brand - AI Communication Platform"
              />
            </div>
          </div>
        </div>

        {/* Email Branding */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Email Branding</h2>
            <p className="text-xs text-gray-500 mt-0.5">Customize outbound emails</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Address</label>
                <input
                  type="email"
                  value={form.emailFrom}
                  onChange={(e) => setForm({ ...form, emailFrom: e.target.value })}
                  className={inputClassName}
                  placeholder="noreply@yourdomain.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                <input
                  type="email"
                  value={form.supportEmail}
                  onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
                  className={inputClassName}
                  placeholder="support@yourdomain.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
              <input
                type="text"
                value={form.footerText}
                onChange={(e) => setForm({ ...form, footerText: e.target.value })}
                className={inputClassName}
                placeholder="Powered by Your Brand"
              />
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Branding'}
          </button>
          {saved && <span className="text-sm text-green-600 font-medium">Saved successfully!</span>}
        </div>
      </div>
    </div>
  )
}
