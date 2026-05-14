import { create } from 'zustand'
import { api } from '../lib/api'
import type { Document } from '../types'

interface DocumentStore {
  // documents keyed by client_id
  documentsByClient: Record<string, Document[]>
  fetchDocuments: (clientId: string) => Promise<void>
  uploadDocument: (clientId: string, file: File) => Promise<Document>
  deleteDocument: (clientId: string, documentId: string) => Promise<void>
  pollStatus: (clientId: string, documentId: string) => Promise<void>
}

export const useDocumentStore = create<DocumentStore>((set) => ({
  documentsByClient: {},

  fetchDocuments: async (clientId) => {
    const { data } = await api.get<Document[]>('/documents', { params: { client_id: clientId } })
    set((s) => ({ documentsByClient: { ...s.documentsByClient, [clientId]: data } }))
  },

  uploadDocument: async (clientId, file) => {
    const form = new FormData()
    form.append('client_id', clientId)
    form.append('file', file)
    const { data } = await api.post<Document>('/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    set((s) => ({
      documentsByClient: {
        ...s.documentsByClient,
        [clientId]: [data, ...(s.documentsByClient[clientId] ?? [])],
      },
    }))
    return data
  },

  deleteDocument: async (clientId, documentId) => {
    await api.delete(`/documents/${documentId}`)
    set((s) => ({
      documentsByClient: {
        ...s.documentsByClient,
        [clientId]: (s.documentsByClient[clientId] ?? []).filter((d) => d.id !== documentId),
      },
    }))
  },

  pollStatus: async (clientId, documentId) => {
    const poll = async () => {
      const { data } = await api.get<{ id: string; ingestion_status: string; error_message: string | null }>(
        `/documents/${documentId}/status`,
      )
      set((s) => ({
        documentsByClient: {
          ...s.documentsByClient,
          [clientId]: (s.documentsByClient[clientId] ?? []).map((d) =>
            d.id === documentId
              ? { ...d, ingestion_status: data.ingestion_status as Document['ingestion_status'], error_message: data.error_message }
              : d,
          ),
        },
      }))
      if (data.ingestion_status === 'pending' || data.ingestion_status === 'processing') {
        setTimeout(() => poll(), 2000)
      }
    }
    await poll()
  },
}))
