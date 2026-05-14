import { create } from 'zustand'
import { api } from '../lib/api'
import type { Client } from '../types'

interface ClientStore {
  clients: Client[]
  loading: boolean
  fetchClients: () => Promise<void>
  createClient: (first_name: string, last_name: string, email?: string) => Promise<Client>
  deleteClient: (id: string) => Promise<void>
}

export const useClientStore = create<ClientStore>((set) => ({
  clients: [],
  loading: false,

  fetchClients: async () => {
    set({ loading: true })
    try {
      const { data } = await api.get<Client[]>('/clients')
      set({ clients: data })
    } finally {
      set({ loading: false })
    }
  },

  createClient: async (first_name, last_name, email) => {
    const { data } = await api.post<Client>('/clients', { first_name, last_name, email: email || null })
    set((s) => ({ clients: [...s.clients, data] }))
    return data
  },

  deleteClient: async (id) => {
    await api.delete(`/clients/${id}`)
    set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }))
  },
}))
