import { useEffect, useState } from 'react'
import { ShieldAlert, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { fetchSplunkAlerts, acknowledgeSplunkAlert } from '../lib/api'
import { Button } from '../components/shared/Button'
import type { SplunkAlert } from '../types'

const ALERT_LABELS: Record<string, string> = {
  'security.unusual_ai_usage':           'Unusual AI Usage',
  'security.excessive_client_access':    'Excessive Client Access',
  'security.repeated_permission_denied': 'Repeated Permission Denied',
  'security.suspicious_access':          'Suspicious Access',
  'security.data_export_spike':          'Data Export Spike',
}

function riskColor(score: number | null) {
  if (score === null) return 'bg-gray-100 text-gray-600'
  if (score >= 0.7)   return 'bg-red-100 text-red-700'
  if (score >= 0.4)   return 'bg-yellow-100 text-yellow-700'
  return 'bg-green-100 text-green-700'
}

function AlertCard({ alert, onAcknowledge }: { alert: SplunkAlert; onAcknowledge: (id: string) => void }) {
  const [loading, setLoading] = useState(false)
  const label = ALERT_LABELS[alert.alert_name] ?? alert.alert_name
  const receivedAt = new Date(alert.received_at).toLocaleString()

  async function handleAcknowledge() {
    setLoading(true)
    try {
      await acknowledgeSplunkAlert(alert.id)
      onAcknowledge(alert.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${alert.acknowledged ? 'bg-gray-50 opacity-60' : 'bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
          <span className="font-medium text-gray-900 text-sm">{label}</span>
        </div>
        {alert.risk_score !== null && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskColor(alert.risk_score)}`}>
            Risk {alert.risk_score.toFixed(2)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
        {alert.user_id && <span>User: <span className="font-mono text-gray-700">{alert.user_id.slice(0, 8)}…</span></span>}
        {(alert.payload as Record<string, unknown>).rag_query_count !== undefined && (
          <span>RAG queries: <strong className="text-gray-700">{String((alert.payload as Record<string, unknown>).rag_query_count)}</strong></span>
        )}
        {(alert.payload as Record<string, unknown>).distinct_clients !== undefined && (
          <span>Clients accessed: <strong className="text-gray-700">{String((alert.payload as Record<string, unknown>).distinct_clients)}</strong></span>
        )}
        {(alert.payload as Record<string, unknown>).denial_count !== undefined && (
          <span>Denials: <strong className="text-gray-700">{String((alert.payload as Record<string, unknown>).denial_count)}</strong></span>
        )}
        {(alert.payload as Record<string, unknown>).download_count !== undefined && (
          <span>Downloads: <strong className="text-gray-700">{String((alert.payload as Record<string, unknown>).download_count)}</strong></span>
        )}
        <span className="col-span-2 text-gray-400">{receivedAt}</span>
      </div>

      {!alert.acknowledged && (
        <Button
          variant="secondary"
          className="self-end text-xs px-3 py-1.5"
          onClick={handleAcknowledge}
          disabled={loading}
        >
          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
          {loading ? 'Acknowledging…' : 'Acknowledge'}
        </Button>
      )}
    </div>
  )
}

export function SecurityOps() {
  const [alerts, setAlerts]       = useState<SplunkAlert[]>([])
  const [showAll, setShowAll]     = useState(false)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchSplunkAlerts(showAll ? undefined : false)
      setAlerts(data)
    } catch {
      setError('Failed to load alerts. Is Splunk enabled?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [showAll])

  function handleAcknowledge(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a))
  }

  const active       = alerts.filter(a => !a.acknowledged)
  const acknowledged = alerts.filter(a => a.acknowledged)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Security &amp; Ops</h1>
              <p className="text-sm text-gray-500">Splunk-detected incidents for your firm</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showAll}
                onChange={e => setShowAll(e.target.checked)}
                className="rounded"
              />
              Show acknowledged
            </label>
            <Button variant="secondary" className="text-sm px-3 py-1.5" onClick={load} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-gray-500 mb-1">Active Alerts</p>
            <p className="text-2xl font-bold text-red-600">{active.length}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-gray-500 mb-1">Acknowledged</p>
            <p className="text-2xl font-bold text-gray-400">{acknowledged.length}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-gray-500 mb-1">Highest Risk</p>
            <p className="text-2xl font-bold text-yellow-600">
              {alerts.length > 0
                ? Math.max(...alerts.map(a => a.risk_score ?? 0)).toFixed(2)
                : '—'}
            </p>
          </div>
        </div>

        {/* Alert feed */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {!loading && alerts.length === 0 && !error && (
          <div className="text-center py-16 text-gray-400">
            <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No alerts found.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {active.map(alert => (
            <AlertCard key={alert.id} alert={alert} onAcknowledge={handleAcknowledge} />
          ))}
          {showAll && acknowledged.length > 0 && (
            <>
              <p className="text-xs text-gray-400 mt-4 mb-1 uppercase tracking-wide font-medium">Acknowledged</p>
              {acknowledged.map(alert => (
                <AlertCard key={alert.id} alert={alert} onAcknowledge={handleAcknowledge} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
