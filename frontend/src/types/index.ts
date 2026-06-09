export type LLMProvider = 'meta' | 'google'

export interface LLMModel {
  id: string
  label: string
  provider: LLMProvider
}

// ─── Backend API types ────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  full_name: string
  preferred_model: string
  gmail_address: string | null
  firm_id: string
}

export interface Client {
  id: string
  firm_id: string
  first_name: string
  last_name: string
  email: string | null
  created_at: string
}

export type IngestionStatus = 'pending' | 'processing' | 'complete' | 'failed'

export interface Document {
  id: string
  client_id: string
  filename: string
  file_type: string
  ingestion_status: IngestionStatus
  error_message: string | null
  created_at: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  model_used?: string | null
  created_at: string
  // local-only convenience alias
  timestamp?: Date
}

export interface Conversation {
  id: string
  firm_id: string
  user_id: string
  client_id: string
  title: string
  created_at: string
  updated_at: string
  // enriched on the frontend
  clientFirstName?: string
  clientLastName?: string
  clientEmail?: string | null
  messages?: Message[]
}

export type EmailDirection = 'inbound' | 'outbound'
export type EmailStatus = 'draft' | 'sent' | 'received'

export interface Email {
  id: string
  direction: EmailDirection
  status: EmailStatus
  from_address: string
  to_address: string
  subject: string
  body: string
  is_read: boolean
  client_id: string | null
  received_at: string | null
  created_at: string
}

export interface SplunkAlert {
  id: string
  firm_id: string
  user_id: string | null
  alert_name: string
  payload: Record<string, unknown>
  splunk_search_id: string | null
  risk_score: number | null
  received_at: string
  acknowledged: boolean
}

// ─── Legacy / local types (kept for compat) ──────────────────────────────────

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
