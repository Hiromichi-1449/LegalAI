import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { Login } from './pages/Login'
import { Chat } from './pages/Chat'
import { SecurityOps } from './pages/SecurityOps'
import { LegalDocument } from './pages/LegalDocument'
import { useAppUser } from './lib/authContext'
import { type ReactNode } from 'react'

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function Callback() {
  return <Spinner />
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()
  const { isReady } = useAppUser()

  if (isLoading || (isAuthenticated && !isReady)) {
    return <Spinner />
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
      <Route path="/privacy-policy" element={<LegalDocument type="privacy" />} />
      <Route path="/terms-of-service" element={<LegalDocument type="terms" />} />
      <Route path="/callback" element={<Callback />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/security-ops"
        element={
          <ProtectedRoute>
            <SecurityOps />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
