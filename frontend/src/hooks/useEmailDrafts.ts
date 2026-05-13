import { useEmailStore } from '../store/emailStore'

export function useEmailDrafts() {
  const drafts = useEmailStore((s) => s.drafts)
  const inbox = useEmailStore((s) => s.inbox)
  const addDraft = useEmailStore((s) => s.addDraft)
  const markRead = useEmailStore((s) => s.markRead)

  return { drafts, inbox, addDraft, markRead }
}
