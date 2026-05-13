import { useEmailDrafts } from '../../hooks/useEmailDrafts'

function formatTime(date: Date) {
  const d = new Date(date)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function EmailPanel() {
  const { inbox, drafts, markRead } = useEmailDrafts()

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      {/* Inbox */}
      <div>
        <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          Inbox
        </p>
        {inbox.map((email) => (
          <button
            key={email.id}
            onClick={() => markRead(email.id)}
            className="w-full flex items-start gap-2 px-3 py-2 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-left transition"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                email.read ? 'border border-gray-300 dark:border-gray-600' : 'bg-blue-600'
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">{email.from}</span>
                <span className="text-[10px] text-gray-400 shrink-0">{formatTime(email.timestamp)}</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{email.subject}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Drafts */}
      <div>
        <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          Drafts
        </p>
        {drafts.map((draft) => (
          <button
            key={draft.id}
            className="w-full flex items-start gap-2 px-3 py-2 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-left transition"
          >
            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 border border-gray-300 dark:border-gray-600" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-medium text-gray-400 truncate">To: {draft.to}</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded font-medium shrink-0">
                  Draft
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{draft.subject}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
