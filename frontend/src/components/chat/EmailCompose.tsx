import { useState } from 'react'

interface EmailComposeProps {
  defaultTo?: string
  defaultSubject?: string
  onClose: () => void
}

export function EmailCompose({ defaultTo = '', defaultSubject = '', onClose }: EmailComposeProps) {
  const [minimized, setMinimized] = useState(false)
  const [to, setTo] = useState(defaultTo)
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState('')

  function handleSend() {
    // In production: POST to email API with { to, subject, body }
    console.log('Send email:', { to, subject, body })
    onClose()
  }

  return (
    <div
      className="fixed bottom-0 right-6 w-[420px] z-50 flex flex-col rounded-t-xl shadow-2xl overflow-hidden"
      style={{ maxHeight: minimized ? 'auto' : '480px' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-700 dark:bg-gray-900 cursor-pointer select-none shrink-0"
        onClick={() => setMinimized((m) => !m)}
      >
        <span className="text-sm font-medium text-white tracking-wide">New Message</span>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); setMinimized((m) => !m) }}
            className="text-gray-300 hover:text-white transition"
            title={minimized ? 'Expand' : 'Minimise'}
          >
            {minimized ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="text-gray-300 hover:text-white transition"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* To */}
          <div className="flex items-center border-b border-gray-200 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-800">
            <span className="text-xs text-gray-400 w-14 shrink-0 font-medium">To</span>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 text-sm outline-none bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-300"
            />
          </div>

          {/* Subject */}
          <div className="flex items-center border-b border-gray-200 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-800">
            <span className="text-xs text-gray-400 w-14 shrink-0 font-medium">Subject</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="flex-1 text-sm outline-none bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-300"
            />
          </div>

          {/* Body */}
          <div className="flex-1 bg-white dark:bg-gray-800 overflow-y-auto">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Compose email…"
              className="w-full h-full min-h-[260px] px-4 py-3 text-sm resize-none outline-none bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-300"
            />
          </div>

          {/* Footer toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-600 shrink-0">
            <button
              onClick={handleSend}
              className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition"
            >
              Send
            </button>

            <div className="flex items-center gap-3">
              {/* Formatting icons (decorative for now) */}
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition" title="Formatting">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7" />
                </svg>
              </button>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition" title="Attach file">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-red-500 transition"
                title="Discard"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
