import { create } from 'zustand'
import type { EmailDraft } from '../types'

interface EmailItem {
  id: string
  from: string
  to: string
  subject: string
  preview: string
  timestamp: Date
  read: boolean
  conversationId?: string
}

interface EmailStore {
  inbox: EmailItem[]
  drafts: EmailDraft[]
  addDraft: (draft: EmailDraft) => void
  markRead: (id: string) => void
}

const SEED_INBOX: EmailItem[] = [
  {
    id: 'e1',
    from: 'James Anderson',
    to: 'lawyer@legalai.com',
    subject: 'Re: Contract Review — follow-up questions',
    preview: 'Thank you for the thorough review. I have a few follow-up questions about the non-compete clause...',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    read: false,
  },
  {
    id: 'e2',
    from: 'Sarah Chen',
    to: 'lawyer@legalai.com',
    subject: 'NDA — counterparty revisions',
    preview: 'The other party has sent back their revised NDA. Please see attached...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    read: true,
  },
  {
    id: 'e3',
    from: 'Court Clerk',
    to: 'lawyer@legalai.com',
    subject: 'Hearing scheduled — Martinez v. TechCorp',
    preview: 'This is to confirm the hearing has been scheduled for...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26),
    read: true,
  },
]

const SEED_DRAFTS: EmailDraft[] = [
  {
    id: 'd1',
    conversationId: '2',
    to: 'sarah.chen@email.com',
    subject: 'NDA Analysis — Key Points',
    body: 'Dear Ms. Chen, following our discussion, here are the key points from the NDA analysis...',
    status: 'draft',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
]

export const useEmailStore = create<EmailStore>((set) => ({
  inbox: SEED_INBOX,
  drafts: SEED_DRAFTS,

  addDraft: (draft) =>
    set((state) => ({ drafts: [draft, ...state.drafts] })),

  markRead: (id) =>
    set((state) => ({
      inbox: state.inbox.map((e) => (e.id === id ? { ...e, read: true } : e)),
    })),
}))
