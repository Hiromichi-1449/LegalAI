import { useEffect, useRef } from 'react'
import { useConversations } from '../../hooks/useConversations'
import { MessageBubble } from './MessageBubble'
import { InputBar } from './InputBar'
import { ModelSelector } from './ModelSelector'
import { api, getAuthHeader } from '../../lib/api'
import type { Message } from '../../types'

function generateId() {
  return Math.random().toString(36).slice(2)
}

export function ChatWindow() {
  const { activeConversation, fetchMessages, addMessage } = useConversations()
  const bottomRef = useRef<HTMLDivElement>(null)
  const streamingRef = useRef<boolean>(false)

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConversation && activeConversation.messages.length === 0) {
      fetchMessages(activeConversation.id)
    }
  }, [activeConversation?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation?.messages])

  async function handleSend(content: string) {
    if (!activeConversation || streamingRef.current) return

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    addMessage(activeConversation.id, userMsg)

    // Start streaming placeholder
    const assistantId = generateId()
    const streamingMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    }
    addMessage(activeConversation.id, streamingMsg)
    streamingRef.current = true

    try {
      const response = await fetch(`${api.defaults.baseURL}/chat/${activeConversation.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getAuthHeader(),
        },
        body: JSON.stringify({ message: content }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const parsed = JSON.parse(line.slice(6))
            if (parsed.token) {
              accumulated += parsed.token
              addMessage(activeConversation.id, {
                id: assistantId,
                role: 'assistant',
                content: accumulated,
                created_at: streamingMsg.created_at,
              })
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      console.error('[Chat] Stream error:', err)
      addMessage(activeConversation.id, {
        id: assistantId,
        role: 'assistant',
        content: 'An error occurred. Please try again.',
        created_at: new Date().toISOString(),
      })
    } finally {
      streamingRef.current = false
    }
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
