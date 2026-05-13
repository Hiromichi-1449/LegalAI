import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { Login } from './pages/Login'
import { Chat } from './pages/Chat'
import { type ReactNode } from 'react'

function Callback() {
  const { isLoading, isAuthenticated, error } = useAuth0()
  console.log('[Callback] isLoading:', isLoading, '| isAuthenticated:', isAuthenticated, '| error:', error)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    loginWithRedirect()
    return null
  }

  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/callback" element={<Callback />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
