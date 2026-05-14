import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { api, setAuthToken } from './api'
import { FirmSetupModal } from '../components/auth/FirmSetupModal'
import type { User } from '../types'

interface AuthContextValue {
  appUser: User | null
  isReady: boolean
}

const AuthContext = createContext<AuthContextValue>({ appUser: null, isReady: false })

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0()
  const [appUser, setAppUser] = useState<User | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [needsFirmName, setNeedsFirmName] = useState(false)
  const [pendingRegister, setPendingRegister] = useState<((name: string) => void) | null>(null)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      setAuthToken(null)
      setIsReady(true)
      return
    }

    ;(async () => {
      try {
        const token = await getAccessTokenSilently()
        setAuthToken(token)

        try {
          const { data } = await api.get<User>('/users/me')
          setAppUser(data)
          setIsReady(true)
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } })?.response?.status
          if (status === 404) {
            // Show firm setup modal and wait for name
            const firmName = await new Promise<string>((resolve) => {
              setNeedsFirmName(true)
              setPendingRegister(() => resolve)
            })

            await api.post('/auth/register', { firm_name: firmName })
            const { data: user } = await api.get<User>('/users/me')
            setAppUser(user)
            setIsReady(true)
          } else {
            throw err
          }
        }
      } catch (e) {
        console.error('[Auth] Registration/profile error:', e)
        setIsReady(true)
      }
    })()
  }, [isAuthenticated, isLoading, getAccessTokenSilently])

  function handleFirmSubmit(name: string) {
    setNeedsFirmName(false)
    pendingRegister?.(name)
    setPendingRegister(null)
  }

  return (
    <AuthContext.Provider value={{ appUser, isReady }}>
      {needsFirmName && <FirmSetupModal onSubmit={handleFirmSubmit} />}
      {children}
    </AuthContext.Provider>
  )
}

export function useAppUser() {
  return useContext(AuthContext)
}
