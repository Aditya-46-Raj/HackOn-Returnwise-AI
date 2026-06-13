import { useEffect } from 'react'
import useAuthStore from '../store/authStore'
import { getCurrentUser } from '../services/authService'

/**
 * useAuthSync — Syncs backend session auth state with Zustand store.
 * Must be mounted once at app root (App.jsx).
 */
export function useAuthSync() {
  const { token, setLoading, logout } = useAuthStore()

  useEffect(() => {
    async function syncAuth() {
      if (token) {
        try {
          setLoading(true)
          await getCurrentUser()
        } catch (err) {
          console.warn("Auth sync failed or session expired:", err)
          logout()
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    syncAuth()
  }, [token])
}

/**
 * useAuth — access auth state anywhere in the component tree.
 */
export function useAuth() {
  const { user, role, token, loading, isAuthenticated, isAdmin } = useAuthStore()
  return { user, role, token, loading, isAuthenticated, isAdmin }
}

export default useAuth
