import { useRef, useState } from 'react'
import { useClientStore } from '../../store/clientStore'
import { useDocumentStore } from '../../store/documentStore'
import type { IngestionStatus } from '../../types'

const statusColor: Record<IngestionStatus, string> = {
  pending: 'text-gray-400',
  processing: 'text-yellow-500',
  complete: 'text-green-500',
  failed: 'text-red-500',
}

const statusLabel: Record<IngestionStatus, string> = {
  pending: 'Pending',
  processing: 'Processing…',
  complete: 'Ready',
  failed: 'Failed',
}

export function FilesPanel() {
  const clients = useClientStore((s) => s.clients)
  const { documentsByClient, fetchDocuments, uploadDocument, deleteDocument, pollStatus } = useDocumentStore()
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)

  function toggle(clientId: string) {
    const nowOpen = !openFolders[clientId]
    setOpenFolders((prev) => ({ ...prev, [clientId]: nowOpen }))
    if (nowOpen && !documentsByClient[clientId]) {
      fetchDocuments(clientId)
    }
  }

  function handleFileClick(clientId: string) {
    setUploadingFor(clientId)
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !uploadingFor) return
    e.target.value = ''
    const doc = await uploadDocument(uploadingFor, file)
    pollStatus(uploadingFor, doc.id)
    setUploadingFor(null)
  }

  return (
    <div className="flex flex-col overflow-y-auto flex-1 py-1">
      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />

      {clients.length === 0 && (
        <p className="px-4 py-3 text-xs text-gray-400">No clients yet. Create a conversation to add a client.</p>
      )}

      {clients.map((client) => {
        const isOpen = !!openFolders[client.id]
        const docs = documentsByClient[client.id] ?? []
        return (
          <div key={client.id}>
            <div className="flex items-center group">
              <button
                onClick={() => toggle(client.id)}
                className="flex-1 flex items-center gap-1.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left"
              >
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                  {client.last_name}, {client.first_name}
                </span>
              </button>

              {/* Upload button */}
              <button
                onClick={() => handleFileClick(client.id)}
                title="Upload document"
                className="opacity-0 group-hover:opacity-100 mr-2 w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </button>
            </div>

            {isOpen && (
              <div className="pl-8">
                {docs.length === 0 && (
                  <p className="px-3 py-1.5 text-[10px] text-gray-400">No documents yet. Upload a PDF or DOCX.</p>
                )}
                {docs.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-1.5 px-3 py-1.5 group/doc hover:bg-gray-50 dark:hover:bg-gray-800">
                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="flex-1 text-xs text-gray-600 dark:text-gray-400 truncate">{doc.filename}</span>
                    <span className={`text-[10px] ${statusColor[doc.ingestion_status]}`} title={doc.error_message ?? ''}>
                      {statusLabel[doc.ingestion_status]}
                    </span>
                    <button
                      onClick={() => deleteDocument(client.id, doc.id)}
                      className="opacity-0 group-hover/doc:opacity-100 text-gray-400 hover:text-red-500 transition"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
