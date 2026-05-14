import { useConversationStore } from '../store/conversationStore'
import type { Conversation, Message } from '../types'

export function useConversations() {
  const conversations = useConversationStore((s) => s.conversations)
  const activeConversationId = useConversationStore((s) => s.activeConversationId)
  const messages = useConversationStore((s) => s.messages)
  const loading = useConversationStore((s) => s.loading)
  const setActiveConversation = useConversationStore((s) => s.setActiveConversation)
  const createConversation = useConversationStore((s) => s.createConversation)
  const deleteConversation = useConversationStore((s) => s.deleteConversation)
  const fetchConversations = useConversationStore((s) => s.fetchConversations)
  const fetchMessages = useConversationStore((s) => s.fetchMessages)
  const addMessage = useConversationStore((s) => s.addMessage)
  const getActiveConversation = useConversationStore((s) => s.getActiveConversation)

  const activeConversation: (Conversation & { messages: Message[] }) | null = (() => {
    const conv = getActiveConversation()
    if (!conv) return null
    return { ...conv, messages: messages[conv.id] ?? [] }
  })()

  return {
    conversations,
    activeConversationId,
    activeConversation,
    messages,
    loading,
    setActiveConversation,
    createConversation,
    deleteConversation,
    fetchConversations,
    fetchMessages,
    addMessage,
  }
}
