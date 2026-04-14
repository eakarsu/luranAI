'use client'
import { usePathname, useRouter } from 'next/navigation'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/voice-agents': 'Voice Agents',
  '/sms-campaigns': 'SMS Campaigns',
  '/chat-agents': 'Chat Agents',
  '/email-agents': 'Email Agents',
  '/contacts': 'Contacts',
  '/conversations': 'Conversations',
  '/call-logs': 'Call Logs',
  '/appointments': 'Appointments',
  '/templates': 'Templates',
  '/campaigns': 'Campaigns',
  '/knowledge-base': 'Knowledge Base',
  '/workflows': 'Workflows',
  '/integrations': 'Integrations',
  '/analytics': 'Analytics',
  '/ai-playground': 'AI Playground',
  '/industries': 'Industries',
  '/organization': 'Organization',
  '/white-label': 'White Label',
  '/settings': 'Settings',
}

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()

  const pageTitle = pageTitles[pathname] || Object.entries(pageTitles).find(([key]) => pathname.startsWith(key + '/'))?.[1] || 'Dashboard'

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Continue with logout even if API call fails
    }
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.push('/login')
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </button>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">D</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">Demo User</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
