'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'

interface Column<T> {
  key: keyof T | string
  label: string
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  basePath: string
  title: string
  searchField?: keyof T
}

export default function DataTable<T extends { id: string }>({ columns, data, basePath, title, searchField }: DataTableProps<T>) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState(data)
  const [selected, setSelected] = useState<T | null>(null)
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setRows(data)
  }, [data])

  const filtered = searchField
    ? rows.filter(item => String(item[searchField]).toLowerCase().includes(search.toLowerCase()))
    : rows

  function formatLabel(key: string) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, (char) => char.toUpperCase())
      .trim()
  }

  function renderDetailValue(value: unknown): React.ReactNode {
    if (value === null || value === undefined || value === '') return '-'
    if (value instanceof Date) return value.toLocaleString()
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'number') return value.toLocaleString()
    if (typeof value === 'string') {
      const parsedDate = Date.parse(value)
      if (/^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(parsedDate)) {
        return new Date(value).toLocaleString()
      }
      return value
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return '-'
      return value.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(', ')
    }
    if (typeof value === 'object') {
      return (
        <div className="space-y-1">
          {Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => (
            <div key={key}>
              <span className="font-medium text-gray-700">{formatLabel(key)}:</span>{' '}
              <span>{renderDetailValue(nestedValue)}</span>
            </div>
          ))}
        </div>
      )
    }
    return String(value)
  }

  async function openDetail(item: T) {
    setSelected(item)
    setDetail(item as Record<string, unknown>)
    setDetailError(null)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api${basePath}/${item.id}`)
      if (!res.ok) throw new Error('Failed to load record details')
      const json = await res.json()
      setDetail(json)
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'Failed to load record details')
    } finally {
      setDetailLoading(false)
    }
  }

  function closeDetail() {
    setSelected(null)
    setDetail(null)
    setDetailError(null)
    setDeleting(false)
  }

  async function deleteSelected() {
    if (!selected) return
    setDeleting(true)
    try {
      const res = await fetch(`/api${basePath}/${selected.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete record')
      setRows((prev) => prev.filter((item) => item.id !== selected.id))
      closeDetail()
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'Failed to delete record')
      setDeleting(false)
    }
  }

  const activeDetail = detail || (selected as Record<string, unknown> | null)
  const modalTitle = selected
    ? `${title}: ${String(activeDetail?.name || activeDetail?.title || selected.id)}`
    : title

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <button
          onClick={() => router.push(`${basePath}/new`)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          + New
        </button>
      </div>
      {searchField && (
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-64 mb-4 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {columns.map((col) => (
                  <th key={String(col.key)} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item, i) => (
                <tr
                  key={item.id}
                  onClick={() => void openDetail(item)}
                  className={`cursor-pointer hover:bg-primary-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {col.render ? col.render(item) : String((item as Record<string, unknown>)[String(col.key)] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-3 text-sm text-gray-500">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>
      <Modal
        isOpen={Boolean(selected)}
        onClose={closeDetail}
        title={modalTitle}
        maxWidthClass="max-w-4xl"
      >
        <div className="space-y-4">
          {detailLoading && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
              Loading record details...
            </div>
          )}
          {detailError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {detailError}
            </div>
          )}
          {detail && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {Object.entries(detail)
                .filter(([key]) => !key.startsWith('_'))
                .map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{formatLabel(key)}</div>
                    <div className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words text-sm text-gray-900">
                      {renderDetailValue(value)}
                    </div>
                  </div>
                ))}
            </div>
          )}
          <div className="flex flex-col-reverse gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={deleteSelected}
              disabled={deleting}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              {selected && (
                <button
                  type="button"
                  onClick={() => router.push(`${basePath}/${selected.id}`)}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
