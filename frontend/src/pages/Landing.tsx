import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { LegalLinks } from '../components/shared/LegalLinks'

export function Landing() {
  const { isAuthenticated, isLoading } = useAuth0()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate('/chat')
  }, [isAuthenticated, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">LegalAI</span>
        </div>
        <Link
          to="/login"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium px-3 py-1 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            AI-Powered Legal Assistant
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
            Legal intelligence,<br />built for your practice
          </h1>

          <p className="text-base text-gray-500 dark:text-gray-400 mb-8 max-w-lg mx-auto">
            LegalAI helps law firms and legal professionals research case law, draft documents,
            and manage client communications — all in one secure, AI-powered workspace.
          </p>

          {/* Feature list */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
            {[
              {
                title: 'Case Research',
                desc: 'Instant AI-assisted research across legal databases and your uploaded documents.',
              },
              {
                title: 'Gmail Integration',
                desc: 'Connect your Gmail inbox to surface relevant client emails alongside your cases.',
              },
              {
                title: 'Firm Management',
                desc: 'Multi-tenant workspaces with role-based access for your entire team.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{f.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>

          <Link
            to="/chat"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-3 rounded-lg transition"
          >
            Get started
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-center py-6 border-t border-gray-200 dark:border-gray-800">
        <LegalLinks />
      </footer>
    </div>
  )
}
