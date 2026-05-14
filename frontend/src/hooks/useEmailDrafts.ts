import { useEmailStore } from '../store/emailStore'

export function useEmailDrafts() {
  const emails = useEmailStore((s) => s.emails)
  const fetchEmails = useEmailStore((s) => s.fetchEmails)
  const sendEmail = useEmailStore((s) => s.sendEmail)
  const saveDraft = useEmailStore((s) => s.saveDraft)

  const inbox = emails.filter((e) => e.direction === 'inbound' || e.status === 'received')
  const drafts = emails.filter((e) => e.status === 'draft')

  return { emails, inbox, drafts, fetchEmails, sendEmail, saveDraft }
}
