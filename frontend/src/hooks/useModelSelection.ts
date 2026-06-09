import { useEffect, useState } from 'react'
import type { LLMModel } from '../types'
import { api } from '../lib/api'
import { useAppUser } from '../lib/authContext'

export const MODELS: LLMModel[] = [
  {
    id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    label: 'Llama 3.3 70B',
    provider: 'meta',
  },
  {
    id: 'meta-llama/Meta-Llama-3-8B-Instruct-Lite',
    label: 'Llama 3 8B Lite',
    provider: 'meta',
  },
  {
    id: 'google/gemma-4-31B-it',
    label: 'Gemma 4 31B',
    provider: 'google',
  },
  {
    id: 'google/gemma-3n-E4B-it',
    label: 'Gemma 3N E4B',
    provider: 'google',
  },
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
