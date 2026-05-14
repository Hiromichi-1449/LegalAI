import { useEffect } from 'react'
import { useEmailStore } from '../../store/emailStore'
import { api } from '../../lib/api'

function formatTime(date: string) {
  const d = new Date(date)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function EmailPanel() {
  const { emails, loading, fetchEmails, markRead } = useEmailStore()

  useEffect(() => {
    fetchEmails()
  }, [])

  const inbox = emails.filter((e) => e.direction === 'inbound' || e.status === 'received')
  const outbound = emails.filter((e) => e.direction === 'outbound' && e.status !== 'draft')
  const drafts = emails.filter((e) => e.status === 'draft')

  async function handleSyncGmail() {
    try {
      await api.post('/gmail/sync')
      fetchEmails()
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 400) {
        // Not connected — get auth URL
        try {
          const { data } = await api.get<{ auth_url: string }>('/gmail/auth-url')
          window.open(data.auth_url, '_blank')
        } catch {
          alert('Failed to connect Gmail.')
        }
      }
    }
  }

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      {/* Sync button */}
      <div className="px-3 py-2">
        <button
          onClick={handleSyncGmail}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Syncing…' : 'Sync Gmail'}
        </button>
      </div>

      {/* Inbox */}
      {inbox.length > 0 && (
        <div>
          <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Inbox</p>
          {inbox.map((email) => (
            <button
              key={email.id}
              onClick={() => !email.is_read && markRead(email.id)}
              className="w-full flex items-start gap-2 px-3 py-2 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-left transition"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                  email.is_read ? 'border border-gray-300 dark:border-gray-600' : 'bg-blue-600'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">{email.from_address}</span>
                  <span className="text-[10px] text-gray-400 shrink-0">{formatTime(email.received_at ?? email.created_at)}</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{email.subject}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Sent */}
      {outbound.length > 0 && (
        <div>
          <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Sent</p>
          {outbound.map((email) => (
            <button
              key={email.id}
              className="w-full flex items-start gap-2 px-3 py-2 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-left transition"
            >
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 border border-gray-300 dark:border-gray-600" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">To: {email.to_address}</span>
                  <span className="text-[10px] text-gray-400 shrink-0">{formatTime(email.created_at)}</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{email.subject}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Drafts */}
      {drafts.length > 0 && (
        <div>
          <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Drafts</p>
          {drafts.map((draft) => (
            <button
              key={draft.id}
              className="w-full flex items-start gap-2 px-3 py-2 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-left transition"
            >
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 border border-gray-300 dark:border-gray-600" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-medium text-gray-400 truncate">To: {draft.to_address}</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded font-medium shrink-0">Draft</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{draft.subject}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {emails.length === 0 && !loading && (
        <p className="px-4 py-3 text-xs text-gray-400">No emails yet. Click Sync Gmail to import your inbox.</p>
      )}
    </div>
  )
}
