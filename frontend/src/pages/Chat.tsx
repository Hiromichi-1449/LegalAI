import { useEffect } from 'react'
import { Sidebar } from '../components/sidebar/Sidebar'
import { ChatWindow } from '../components/chat/ChatWindow'
import { api } from '../lib/api'
import { useEmailStore } from '../store/emailStore'

export function Chat() {
  const { fetchEmails } = useEmailStore()

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('gmail') !== 'connected') return
    window.history.replaceState({}, '', window.location.pathname)
    api.post('/gmail/sync').then(() => fetchEmails()).catch(() => {})
  }, [fetchEmails])

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <ChatWindow />
    </div>
  )
}
