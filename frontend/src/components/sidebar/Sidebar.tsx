import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useConversations } from '../../hooks/useConversations'
import { useThemeStore } from '../../store/themeStore'
import { ConversationHistory } from './ConversationHistory'
import { FilesPanel } from './FilesPanel'
import { EmailPanel } from './EmailPanel'
import type { Conversation, Message } from '../../types'

type Tab = 'history' | 'files' | 'email'

function generateId() {
  return Math.random().toString(36).slice(2)
}

export function Sidebar() {
  const [activeTab, setActiveTab] = useState<Tab>('history')
  const { user } = useAuth0()
  const { addConversation } = useConversations()
  const { isDark, toggle } = useThemeStore()

  const displayName = user?.name ?? 'User'
  const email = user?.email ?? ''
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  function handleNewConversation() {
    const now = new Date()
    const newConv: Conversation = {
      id: generateId(),
      title: 'New Conversation',
      clientFirstName: 'New',
      clientLastName: 'Client',
      messages: [] as Message[],
      createdAt: now,
      updatedAt: now,
    }
    addConversation(newConv)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'history', label: 'History' },
    { key: 'files', label: 'Files' },
    { key: 'email', label: 'Email' },
  ]

  return (
    <div className="w-60 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-700 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">LegalAI</span>
      </div>

      {/* New conversation */}
      <div className="px-3 pb-2">
        <button
          onClick={handleNewConversation}
          className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New conversation
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-700">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-2 text-xs transition ${
              activeTab === key
                ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'history' && <ConversationHistory />}
        {activeTab === 'files' && <FilesPanel />}
        {activeTab === 'email' && <EmailPanel />}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 dark:border-gray-700">
        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-[10px] font-medium text-blue-700 dark:text-blue-300 shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{displayName}</p>
          <p className="text-[10px] text-gray-400 truncate">{email}</p>
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          {isDark ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
