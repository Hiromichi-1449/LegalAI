import { Link } from 'react-router-dom'

interface LegalLinksProps {
  className?: string
}

export function LegalLinks({ className = '' }: LegalLinksProps) {
  return (
    <nav className={`flex items-center gap-2 text-[11px] ${className}`} aria-label="Legal links">
      <Link
        to="/privacy-policy"
        className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
      >
        Privacy Policy
      </Link>
      <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">
        |
      </span>
      <Link
        to="/terms-of-service"
        className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
      >
        Terms of Service
      </Link>
    </nav>
  )
}
