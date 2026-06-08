import { isToday, isYesterday } from 'date-fns'
import { useConversations } from '../../hooks/useConversations'
import { useClientStore } from '../../store/clientStore'
import type { Conversation } from '../../types'

function getDateGroup(date: string): 'Today' | 'Yesterday' | 'Earlier' {
  const d = new Date(date)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return 'Earlier'
}

function getInitials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

function relativeTime(date: string) {
  const now = Date.now()
  const diff = now - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export function ConversationHistory() {
  const { conversations, activeConversationId, setActiveConversation, deleteConversation } =
    useConversations()
  const clients = useClientStore((s) => s.clients)

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]))

  const sorted = [...conversations].sort((a, b) => {
    const ac = clientMap[a.client_id]
    const bc = clientMap[b.client_id]
    if (ac && bc) {
      const lnCmp = ac.last_name.localeCompare(bc.last_name)
      if (lnCmp !== 0) return lnCmp
    }
    return 0
  })

  const grouped: Record<string, Conversation[]> = { Today: [], Yesterday: [], Earlier: [] }
  sorted.forEach((c) => {
    grouped[getDateGroup(c.updated_at)].push(c)
  })

  return (
    <div className="flex flex-col gap-1 overflow-y-auto flex-1 py-1">
      {(['Today', 'Yesterday', 'Earlier'] as const).map((group) =>
        grouped[group].length > 0 ? (
          <div key={group}>
            <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              {group}
            </p>
            {grouped[group].map((conv) => {
              const client = clientMap[conv.client_id]
              const firstName = client?.first_name ?? conv.clientFirstName ?? '?'
              const lastName = client?.last_name ?? conv.clientLastName ?? '?'
              return (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-md mx-1 transition ${
                    conv.id === activeConversationId
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <button
                    onClick={() => setActiveConversation(conv.id)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  >
                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-medium text-gray-600 dark:text-gray-300 shrink-0">
                      {getInitials(firstName, lastName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">
                        {lastName}, {firstName}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">{conv.title}</p>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-gray-400 group-hover:hidden">
                      {relativeTime(conv.updated_at)}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                      title="Delete conversation"
                      className="hidden group-hover:flex items-center justify-center w-5 h-5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null
      )}
    </div>
  )
}
