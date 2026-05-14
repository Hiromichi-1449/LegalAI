import { useState, type FormEvent } from 'react'

interface Props {
  onSubmit: (firmName: string) => void
}

export function FirmSetupModal({ onSubmit }: Props) {
  const [firmName, setFirmName] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const name = firmName.trim()
    if (!name) return
    onSubmit(name)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-80 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Welcome to LegalAI</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Create your firm workspace to get started. You can invite colleagues later.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Firm name</label>
            <input
              autoFocus
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              placeholder="e.g. Smith & Associates LLP"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={!firmName.trim()}
            className="w-full py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-40"
          >
            Create workspace
          </button>
        </form>
      </div>
    </div>
  )
}
