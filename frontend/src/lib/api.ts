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
