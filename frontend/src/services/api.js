/**
 * API base service — wraps fetch with auth token injection.
 */
import useAuthStore from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function apiFetch(path, options = {}) {
  const token = useAuthStore.getState().token
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

export default apiFetch
