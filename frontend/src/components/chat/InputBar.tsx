import { useRef, useState, type KeyboardEvent, type ChangeEvent } from 'react'
import jsPDF from 'jspdf'
import type { Conversation } from '../../types'
import { EmailCompose } from './EmailCompose'

interface InputBarProps {
  activeConversation: (Conversation & { messages?: { role: string; content: string }[] }) | null
  onSend: (content: string) => void
}

export function InputBar({ activeConversation, onSend }: InputBarProps) {
  const [value, setValue] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [showEmail, setShowEmail] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) setAttachedFiles((prev) => [...prev, ...files])
    e.target.value = ''
  }

  function removeAttachment(index: number) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleInput() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 112) + 'px'
  }

  function handleSavePDF() {
    if (!activeConversation) return
    const messages = activeConversation.messages ?? []
    const lastMsg = messages.filter((m) => m.role === 'assistant').at(-1)
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text(`Case Statement — ${activeConversation.title}`, 20, 20)
    doc.setFontSize(11)
    doc.text(lastMsg?.content ?? '', 20, 35, { maxWidth: 170 })
    doc.save(`case_statement_${activeConversation.title.replace(/\s+/g, '_')}.pdf`)
  }

  return (
    <>
      {/* Gmail-style compose window */}
      {showEmail && (
        <EmailCompose
          defaultSubject={activeConversation ? `Re: ${activeConversation.title}` : ''}
          onClose={() => setShowEmail(false)}
        />
      )}

      <div className="px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Attached file chips */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {attachedFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-300 max-w-[160px]"
              >
                <svg className="w-3 h-3 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="truncate">{file.name}</span>
                <button
                  onClick={() => removeAttachment(i)}
                  className="shrink-0 ml-0.5 text-gray-400 hover:text-red-500 transition"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => { setValue(e.target.value); handleInput() }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none text-sm px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-28"
            style={{ overflowY: 'auto' }}
          />

          <button
            onClick={submit}
            disabled={!value.trim()}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            Attach
          </button>

          <button
            onClick={handleSavePDF}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Save as PDF
          </button>

          <button
            onClick={() => setShowEmail(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 border border-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send email
          </button>
        </div>
      </div>
    </>
  )
}
