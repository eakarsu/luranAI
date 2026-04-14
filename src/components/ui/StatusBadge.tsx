interface StatusBadgeProps {
  status: string
}

const statusStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  draft: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-purple-100 text-purple-800',
  running: 'bg-green-100 text-green-800',
  sent: 'bg-blue-100 text-blue-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  resolved: 'bg-green-100 text-green-800',
  open: 'bg-blue-100 text-blue-800',
  closed: 'bg-gray-100 text-gray-800',
  connected: 'bg-green-100 text-green-800',
  disconnected: 'bg-red-100 text-red-800',
  lead: 'bg-blue-100 text-blue-800',
  customer: 'bg-green-100 text-green-800',
  prospect: 'bg-purple-100 text-purple-800',
  initiating: 'bg-blue-100 text-blue-800',
  ringing: 'bg-yellow-100 text-yellow-800',
  'in-progress': 'bg-green-100 text-green-800',
  busy: 'bg-orange-100 text-orange-800',
  'no-answer': 'bg-red-100 text-red-800',
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}>
      {status}
    </span>
  )
}
