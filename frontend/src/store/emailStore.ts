import { create } from 'zustand'
import { api } from '../lib/api'
import type { Email } from '../types'

interface EmailStore {
  emails: Email[]
  loading: boolean
  fetchEmails: () => Promise<void>
  sendEmail: (to: string, subject: string, body: string, clientId?: string) => Promise<Email>
  saveDraft: (to: string, subject: string, body: string, clientId?: string) => Promise<Email>
}

export const useEmailStore = create<EmailStore>((set) => ({
  emails: [],
  loading: false,

  fetchEmails: async () => {
    set({ loading: true })
    try {
      const { data } = await api.get<Email[]>('/emails')
      set({ emails: data })
    } finally {
      set({ loading: false })
    }
  },

  sendEmail: async (to_address, subject, body, client_id) => {
    const { data } = await api.post<Email>('/emails/send', {
      to_address,
      subject,
      body,
      client_id: client_id ?? null,
    })
    set((s) => ({ emails: [data, ...s.emails] }))
    return data
  },

  saveDraft: async (to_address, subject, body, client_id) => {
    const { data } = await api.post<Email>('/emails/draft', {
      to_address,
      subject,
      body,
      client_id: client_id ?? null,
    })
    set((s) => ({ emails: [data, ...s.emails] }))
    return data
  },
}))
