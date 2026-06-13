import useAuthStore from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export async function login(email, password) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Login failed')
  }
  
  const data = await response.json()
  
  // Save credentials to Zustand authStore
  useAuthStore.getState().setToken(data.token)
  useAuthStore.getState().setRole(data.role)
  useAuthStore.getState().setUser(data.user)
  
  return data
}

export async function logout() {
  const token = useAuthStore.getState().token
  if (token) {
    await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).catch(err => console.error('Logout request failed', err))
  }
  
  useAuthStore.getState().logout()
}

export async function getCurrentUser() {
  const token = useAuthStore.getState().token
  if (!token) return null
  
  const response = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  if (!response.ok) {
    throw new Error('Session expired')
  }
  
  const user = await response.json()
  
  useAuthStore.getState().setRole(user.role)
  useAuthStore.getState().setUser({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: null
  })
  
  return user
}
