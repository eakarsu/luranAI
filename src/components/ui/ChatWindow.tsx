'use client'

import { useEffect, useRef, useState, KeyboardEvent } from 'react'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface ChatWindowProps {
  messages: ChatMessage[]
  onSend: (text: string) => void | Promise<void>
  isSending?: boolean
  isDisabled?: boolean
  placeholder?: string
  emptyState?: string
  agentLabel?: string
  userLabel?: string
  minHeight?: string
}

export default function ChatWindow({
  messages,
  onSend,
  isSending = false,
  isDisabled = false,
  placeholder = 'Type your message…',
  emptyState = 'Send a message to start the conversation.',
  agentLabel = 'AI',
  userLabel = 'You',
  minHeight = '500px',
}: ChatWindowProps) {
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isSending || isDisabled) return
    setInput('')
    await onSend(text)
    // Refocus for fast follow-ups
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col"
      style={{ minHeight }}
    >
      {/* Messages */}
      <div className="flex-1 bg-gray-50 border-b border-gray-200 p-4 overflow-y-auto" style={{ minHeight: '300px' }}>
        {messages.length === 0 && !isSending ? (
          <p className="text-gray-400 text-sm text-center mt-16">{emptyState}</p>
        ) : (
          <div className="space-y-4">
            {messages.map((entry, i) => (
              <div
                key={i}
                className={`flex flex-col ${entry.role === 'assistant' ? 'items-start' : 'items-end'}`}
              >
                <span
                  className={`text-xs font-semibold mb-1 px-2 py-0.5 rounded-full ${
                    entry.role === 'assistant'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {entry.role === 'assistant' ? agentLabel : userLabel}
                </span>
                <div
                  className={`rounded-lg px-3 py-2 max-w-[85%] text-sm whitespace-pre-wrap ${
                    entry.role === 'assistant'
                      ? 'bg-primary-50 border border-primary-200 text-gray-800'
                      : 'bg-white border border-gray-300 text-gray-800'
                  }`}
                >
                  {entry.content}
                </div>
                <span className="text-xs text-gray-400 mt-0.5">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {isSending && (
              <div className="flex flex-col items-start">
                <span className="text-xs font-semibold mb-1 px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                  {agentLabel}
                </span>
                <div className="rounded-lg px-3 py-2 bg-primary-50 border border-primary-200 text-gray-500 text-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          disabled={isDisabled || isSending}
          className="flex-1 resize-none px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isSending || isDisabled}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSending ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
          Send
        </button>
      </div>
    </div>
  )
}
