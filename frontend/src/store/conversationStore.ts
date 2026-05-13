import { create } from 'zustand'
import type { Conversation, Message } from '../types'

interface ConversationStore {
  conversations: Conversation[]
  activeConversationId: string | null
  setActiveConversation: (id: string) => void
  addConversation: (conversation: Conversation) => void
  deleteConversation: (id: string) => void
  addMessage: (conversationId: string, message: Message) => void
  getActiveConversation: () => Conversation | null
}

const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    title: 'Contract Review',
    clientFirstName: 'James',
    clientLastName: 'Anderson',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Can you review this employment contract for any red flags?',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        id: 'm2',
        role: 'assistant',
        content:
          'I\'d be happy to review the employment contract. Please share the document and I\'ll analyze it for any concerning clauses, non-compete agreements, IP assignment terms, and other important provisions.',
        timestamp: new Date(Date.now() - 1000 * 60 * 29),
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    updatedAt: new Date(Date.now() - 1000 * 60 * 29),
  },
  {
    id: '2',
    title: 'NDA Negotiation',
    clientFirstName: 'Sarah',
    clientLastName: 'Chen',
    messages: [
      {
        id: 'm3',
        role: 'user',
        content: 'What terms should I negotiate in this NDA?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25),
      },
      {
        id: 'm4',
        role: 'assistant',
        content:
          'Key NDA terms to negotiate include: duration (1-3 years is standard), scope of confidential information, permitted disclosures, return/destruction of materials, and injunctive relief clauses. Would you like me to elaborate on any of these?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25 + 60000),
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 25 + 60000),
  },
  {
    id: '3',
    title: 'IP Dispute',
    clientFirstName: 'Robert',
    clientLastName: 'Martinez',
    messages: [
      {
        id: 'm5',
        role: 'user',
        content: 'I think my former employer is infringing on my patent.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 49),
      },
      {
        id: 'm6',
        role: 'assistant',
        content:
          'Patent infringement claims require demonstrating that the alleged infringer uses every element of at least one claim of your patent. Let\'s start by reviewing your patent claims and the allegedly infringing product or process.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 49 + 60000),
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 49),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 49 + 60000),
  },
]

export const useConversationStore = create<ConversationStore>((set, get) => ({
  conversations: SEED_CONVERSATIONS,
  activeConversationId: SEED_CONVERSATIONS[0].id,

  setActiveConversation: (id) => set({ activeConversationId: id }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
      activeConversationId: conversation.id,
    })),

  deleteConversation: (id) =>
    set((state) => {
      const remaining = state.conversations.filter((c) => c.id !== id)
      const newActiveId =
        state.activeConversationId === id
          ? (remaining[0]?.id ?? null)
          : state.activeConversationId
      return { conversations: remaining, activeConversationId: newActiveId }
    }),

  addMessage: (conversationId, message) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, message], updatedAt: new Date() }
          : c
      ),
    })),

  getActiveConversation: () => {
    const { conversations, activeConversationId } = get()
    return conversations.find((c) => c.id === activeConversationId) ?? null
  },
}))
