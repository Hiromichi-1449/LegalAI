import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
})

// Inject Auth0 token on every request. Set this via setAuthToken after login.
let _token: string | null = null

export function setAuthToken(token: string | null) {
  _token = token
}

export function getAuthHeader(): string {
  return _token ? `Bearer ${_token}` : ''
}

api.interceptors.request.use((config) => {
  if (_token) config.headers.Authorization = `Bearer ${_token}`
  return config
})

export async function fetchSplunkAlerts(acknowledged?: boolean) {
  const params: Record<string, string> = {}
  if (acknowledged !== undefined) params.acknowledged = String(acknowledged)
  const res = await api.get('/internal/splunk-alerts', { params })
  return res.data
}

export async function acknowledgeSplunkAlert(alertId: string) {
  const res = await api.patch(`/internal/splunk-alerts/${alertId}/acknowledge`)
  return res.data
}

export async function investigateAlert(question: string, alertId?: string): Promise<string> {
  const res = await api.post('/internal/investigate', { question, alert_id: alertId ?? null })
  return res.data.summary
}
