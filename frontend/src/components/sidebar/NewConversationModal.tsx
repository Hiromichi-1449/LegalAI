import { useState } from 'react'
import { useClientStore } from '../../store/clientStore'
import { useConversations } from '../../hooks/useConversations'

interface Props {
  onClose: () => void
}

export function NewConversationModal({ onClose }: Props) {
  const { clients, createClient } = useClientStore()
  const { createConversation } = useConversations()

  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [newClientMode, setNewClientMode] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    try {
      let clientId = selectedClientId
      if (newClientMode) {
        if (!firstName.trim() || !lastName.trim()) return
        const client = await createClient(firstName.trim(), lastName.trim(), clientEmail || undefined)
        clientId = client.id
      }
      if (!clientId) return
      await createConversation(clientId, title.trim())
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-80 p-5">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">New conversation</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Contract Review"
              className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!newClientMode ? (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Client</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— select a client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.last_name}, {c.first_name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setNewClientMode(true)}
                className="mt-1 text-xs text-blue-600 hover:underline"
              >
                + New client
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">New client</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Email (optional)"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setNewClientMode(false)}
                className="text-xs text-gray-400 hover:underline text-left"
              >
                ← Pick existing client
              </button>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-1.5 text-xs text-gray-500 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || (!selectedClientId && !newClientMode)}
              className="flex-1 py-1.5 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-40"
            >
              {loading ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
