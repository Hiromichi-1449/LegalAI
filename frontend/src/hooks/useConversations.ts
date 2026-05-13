import { useConversationStore } from '../store/conversationStore'

export function useConversations() {
  const conversations = useConversationStore((s) => s.conversations)
  const activeConversationId = useConversationStore((s) => s.activeConversationId)
  const setActiveConversation = useConversationStore((s) => s.setActiveConversation)
  const addConversation = useConversationStore((s) => s.addConversation)
  const deleteConversation = useConversationStore((s) => s.deleteConversation)
  const addMessage = useConversationStore((s) => s.addMessage)
  const getActiveConversation = useConversationStore((s) => s.getActiveConversation)

  return {
    conversations,
    activeConversationId,
    activeConversation: getActiveConversation(),
    setActiveConversation,
    addConversation,
    deleteConversation,
    addMessage,
  }
}
