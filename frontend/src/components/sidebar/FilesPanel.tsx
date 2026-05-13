import { useState } from 'react'
import { useConversations } from '../../hooks/useConversations'
import type { Conversation } from '../../types'

interface ClientGroup {
  key: string
  clientFirstName: string
  clientLastName: string
  conversations: Conversation[]
}

export function FilesPanel() {
  const { conversations, setActiveConversation } = useConversations()
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({})

  const clientMap: Record<string, ClientGroup> = {}
  conversations.forEach((c) => {
    const key = `${c.clientLastName}_${c.clientFirstName}`
    if (!clientMap[key]) {
      clientMap[key] = {
        key,
        clientFirstName: c.clientFirstName,
        clientLastName: c.clientLastName,
        conversations: [],
      }
    }
    clientMap[key].conversations.push(c)
  })

  const groups = Object.values(clientMap).sort((a, b) => {
    const ln = a.clientLastName.localeCompare(b.clientLastName)
    return ln !== 0 ? ln : a.clientFirstName.localeCompare(b.clientFirstName)
  })

  function toggle(key: string) {
    setOpenFolders((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="flex flex-col overflow-y-auto flex-1 py-1">
      {groups.map((group) => {
        const isOpen = !!openFolders[group.key]
        return (
          <div key={group.key}>
            <button
              onClick={() => toggle(group.key)}
              className="w-full flex items-center gap-1.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left"
            >
              <svg
                className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                {group.clientLastName}, {group.clientFirstName}
              </span>
            </button>

            {isOpen && (
              <div className="pl-8">
                {group.conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversation(conv.id)}
                    className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{conv.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
