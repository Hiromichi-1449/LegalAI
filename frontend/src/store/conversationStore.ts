import { create } from 'zustand'
import { api } from '../lib/api'
import type { Conversation, Message } from '../types'

interface ConversationStore {
  conversations: Conversation[]
  activeConversationId: string | null
  messages: Record<string, Message[]>
  loading: boolean

  fetchConversations: () => Promise<void>
  setActiveConversation: (id: string) => void
  createConversation: (clientId: string, title: string) => Promise<Conversation>
  deleteConversation: (id: string) => Promise<void>

  fetchMessages: (conversationId: string) => Promise<void>
  addMessage: (conversationId: string, message: Message) => void
  getActiveConversation: () => Conversation | null
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  loading: false,

  fetchConversations: async () => {
    set({ loading: true })
    try {
      const { data } = await api.get<Conversation[]>('/conversations')
      set({ conversations: data, loading: false })
      // Restore active selection if still valid
      const { activeConversationId } = get()
      if (!activeConversationId && data.length > 0) {
        set({ activeConversationId: data[0].id })
      }
    } catch {
      set({ loading: false })
    }
  },

  setActiveConversation: (id) => set({ activeConversationId: id }),

  createConversation: async (clientId, title) => {
    const { data } = await api.post<Conversation>('/conversations', { client_id: clientId, title })
    set((s) => ({
      conversations: [data, ...s.conversations],
      activeConversationId: data.id,
    }))
    return data
  },

  deleteConversation: async (id) => {
    await api.delete(`/conversations/${id}`)
    set((s) => {
      const remaining = s.conversations.filter((c) => c.id !== id)
      const newActive =
        s.activeConversationId === id ? (remaining[0]?.id ?? null) : s.activeConversationId
      const msgs = { ...s.messages }
      delete msgs[id]
      return { conversations: remaining, activeConversationId: newActive, messages: msgs }
    })
  },

  fetchMessages: async (conversationId) => {
    const { data } = await api.get<Message[]>(`/conversations/${conversationId}/messages`)
    set((s) => ({ messages: { ...s.messages, [conversationId]: data } }))
  },

  addMessage: (conversationId, message) =>
    set((s) => {
      const existing = s.messages[conversationId] ?? []
      const idx = existing.findIndex((m) => m.id === message.id)
      const updated = idx >= 0
        ? existing.map((m, i) => (i === idx ? message : m))
        : [...existing, message]
      return {
        messages: { ...s.messages, [conversationId]: updated },
        conversations: s.conversations.map((c) =>
          c.id === conversationId ? { ...c, updated_at: new Date().toISOString() } : c,
        ),
      }
    }),

  getActiveConversation: () => {
    const { conversations, activeConversationId } = get()
    return conversations.find((c) => c.id === activeConversationId) ?? null
  },
}))
