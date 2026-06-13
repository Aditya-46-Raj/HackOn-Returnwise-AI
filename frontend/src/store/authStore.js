import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      role: null,         // warehouse_operator | admin | manager
      token: null,
      loading: true,

      setUser: (user) => set({ user, loading: false }),
      setRole: (role) => set({ role }),
      setToken: (token) => set({ token }),
      setLoading: (loading) => set({ loading }),

      logout: () => set({ user: null, role: null, token: null, loading: false }),

      isAuthenticated: () => !!get().user,
      isAdmin: () => ['admin', 'manager'].includes(get().role),
    }),
    {
      name: 'returnwise-auth',
      partialize: (state) => ({ user: state.user, role: state.role }),
    }
  )
)

export default useAuthStore
