export type LLMProvider = 'openai' | 'anthropic'

export interface LLMModel {
  id: string
  label: string
  provider: LLMProvider
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface Conversation {
  id: string
  title: string
  clientFirstName: string
  clientLastName: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export interface EmailDraft {
  id: string
  conversationId: string
  to: string
  subject: string
  body: string
  status: 'draft' | 'sent'
  createdAt: Date
}

export interface FileGroup {
  id: string
  clientLastName: string
  clientFirstName: string
  conversationIds: string[]
  pdfDrafts: PDFDraft[]
}

export interface PDFDraft {
  id: string
  filename: string
  conversationId: string
  createdAt: Date
}
