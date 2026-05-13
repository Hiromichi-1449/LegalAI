import { useState } from 'react'
import type { LLMModel } from '../types'

export const MODELS: LLMModel[] = [
  { id: 'gpt-5.4', label: 'GPT-5.4', provider: 'openai' },
  { id: 'gpt-5.5-turbo', label: 'GPT-5.5 Turbo', provider: 'openai' },
  { id: 'gpt-5.4-mini', label: 'GPT-5.4 Mini', provider: 'openai' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', provider: 'anthropic' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', provider: 'anthropic' },
  { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', provider: 'anthropic' },
]

export function useModelSelection() {
  const [selectedModel, setSelectedModel] = useState<LLMModel>(MODELS[0])
  return { selectedModel, setSelectedModel, models: MODELS }
}
