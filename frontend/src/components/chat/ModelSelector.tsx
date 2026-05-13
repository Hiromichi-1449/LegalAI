import { useEffect, useRef, useState } from 'react'
import type { LLMModel, LLMProvider } from '../../types'
import { MODELS, useModelSelection } from '../../hooks/useModelSelection'

const providerDot: Record<LLMProvider, string> = {
  openai: 'bg-blue-500',
  anthropic: 'bg-purple-500',
}

const providerLabel: Record<LLMProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
}

export function ModelSelector() {
  const { selectedModel, setSelectedModel } = useModelSelection()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const grouped = MODELS.reduce<Record<LLMProvider, LLMModel[]>>(
    (acc, m) => {
      acc[m.provider] = [...(acc[m.provider] ?? []), m]
      return acc
    },
    { openai: [], anthropic: [] }
  )

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
      >
        <span className={`w-2 h-2 rounded-full ${providerDot[selectedModel.provider]}`} />
        {selectedModel.label}
        <span className="text-gray-400">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-50 py-2">
          {(Object.keys(grouped) as LLMProvider[]).map((provider) => (
            <div key={provider}>
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
                {providerLabel[provider]}
              </div>
              {grouped[provider].map((model) => (
                <button
                  key={model.id}
                  onClick={() => { setSelectedModel(model); setOpen(false) }}
                  className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                    selectedModel.id === model.id
                      ? 'text-blue-600 font-medium'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${providerDot[provider]}`} />
                  {model.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
