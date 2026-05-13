import { Sidebar } from '../components/sidebar/Sidebar'
import { ChatWindow } from '../components/chat/ChatWindow'

export function Chat() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <ChatWindow />
    </div>
  )
}
