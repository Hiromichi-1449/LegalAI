import { Link } from 'react-router-dom'

type LegalDocumentType = 'privacy' | 'terms'

interface LegalDocumentProps {
  type: LegalDocumentType
}

const documents: Record<LegalDocumentType, { title: string; updated: string; sections: string[] }> = {
  privacy: {
    title: 'Privacy Policy',
    updated: 'Add effective date',
    sections: [
      'Add how LegalAI collects, uses, stores, and protects account, case, document, and email data.',
      'Add details for third-party services such as Auth0, Gmail, model providers, hosting, and analytics.',
      'Add user rights, data retention, support contact, and jurisdiction-specific disclosures.',
    ],
  },
  terms: {
    title: 'Terms of Service',
    updated: 'Add effective date',
    sections: [
      'Add permitted use, account responsibilities, and acceptable-use rules for LegalAI.',
      'Add limitations around legal advice, AI-generated outputs, confidentiality, and professional review.',
      'Add billing, termination, disclaimers, liability limits, governing law, and support contact.',
    ],
  },
}

export function LegalDocument({ type }: LegalDocumentProps) {
  const document = documents[type]

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8 text-gray-900 dark:text-gray-100">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/chat"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Back to LegalAI
        </Link>

        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col gap-2 border-b border-gray-100 pb-5 dark:border-gray-700">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
              LegalAI
            </p>
            <h1 className="text-2xl font-semibold">{document.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Effective date: {document.updated}</p>
          </div>

          <div className="mt-6 space-y-4 text-sm leading-6 text-gray-600 dark:text-gray-300">
            {document.sections.map((section) => (
              <p key={section}>{section}</p>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
