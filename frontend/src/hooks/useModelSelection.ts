import { useEffect, useState } from 'react'
import type { LLMModel } from '../types'
import { api } from '../lib/api'
import { useAppUser } from '../lib/authContext'

export const MODELS: LLMModel[] = [
  { id: 'gpt-5.4', label: 'GPT-5.4', provider: 'openai' },
  { id: 'gpt-5.5-turbo', label: 'GPT-5.5 Turbo', provider: 'openai' },
  { id: 'gpt-5.4-mini', label: 'GPT-5.4 Mini', provider: 'openai' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', provider: 'anthropic' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', provider: 'anthropic' },
  { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', provider: 'anthropic' },
]

export function useModelSelection() {
  const { appUser } = useAppUser()
  const [selectedModel, setSelectedModelState] = useState<LLMModel>(MODELS[0])

  // Sync with backend preferred_model on first load
  useEffect(() => {
    if (appUser?.preferred_model) {
      const found = MODELS.find((m) => m.id === appUser.preferred_model)
      if (found) setSelectedModelState(found)
    }
  }, [appUser?.preferred_model])

  async function setSelectedModel(model: LLMModel) {
    setSelectedModelState(model)
    try {
      await api.patch('/users/me', { preferred_model: model.id })
    } catch (e) {
      console.warn('[ModelSelection] Failed to persist model preference:', e)
    }
  }

  return { selectedModel, setSelectedModel, models: MODELS }
}
