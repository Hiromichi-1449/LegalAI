import { useEffect, useRef } from 'react'
import { useConversations } from '../../hooks/useConversations'
import { MessageBubble } from './MessageBubble'
import { InputBar } from './InputBar'
import { ModelSelector } from './ModelSelector'
import type { Message } from '../../types'

function generateId() {
  return Math.random().toString(36).slice(2)
}

export function ChatWindow() {
  const { activeConversation, addMessage } = useConversations()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation?.messages])

  function handleSend(content: string) {
    if (!activeConversation) return

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    addMessage(activeConversation.id, userMsg)

    setTimeout(() => {
      const assistantMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: "Thank you for your message. I'm reviewing your legal query and will provide a thorough analysis shortly. In a production environment, this would be connected to an AI model via the backend API.",
        timestamp: new Date(),
      }
      addMessage(activeConversation.id, assistantMsg)
    }, 1200)
  }

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-sm text-gray-400">Select or start a conversation</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Topbar */}
      <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{activeConversation.title}</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <ModelSelector />
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 bg-gray-50 dark:bg-gray-900">
        {activeConversation.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <InputBar activeConversation={activeConversation} onSend={handleSend} />
    </div>
  )
}
