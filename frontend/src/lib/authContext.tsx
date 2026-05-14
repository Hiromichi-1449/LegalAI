import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { api, setAuthToken } from './api'
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

        // Try to fetch existing user profile first
        try {
          const { data } = await api.get<User>('/users/me')
          setAppUser(data)
        } catch (err: unknown) {
          // 404 = not registered yet → register
          const status = (err as { response?: { status?: number } })?.response?.status
          if (status === 404) {
            const firmName = prompt('Welcome to LegalAI! Enter your firm name to create your workspace:') ?? 'My Firm'
            const { data } = await api.post<{ user_id: string; firm_id: string; is_new_firm: boolean }>(
              '/auth/register',
              { firm_name: firmName },
            )
            // Fetch the full user profile after registration
            const { data: user } = await api.get<User>('/users/me')
            setAppUser(user)
            console.log('[Auth] Registered new firm/user:', data)
          } else {
            throw err
          }
        }
      } catch (e) {
        console.error('[Auth] Registration/profile error:', e)
      } finally {
        setIsReady(true)
      }
    })()
  }, [isAuthenticated, isLoading, getAccessTokenSilently])

  return <AuthContext.Provider value={{ appUser, isReady }}>{children}</AuthContext.Provider>
}

export function useAppUser() {
  return useContext(AuthContext)
}
