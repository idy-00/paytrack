import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, setToken, getToken } from '@/lib/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const response = await api.login(email, password)
          setToken(response.token)
          set({ user: response.user, isAuthenticated: true, loading: false })
          return response.user
        } catch (err) {
          set({ error: err.message, loading: false })
          throw err
        }
      },

      register: async (data) => {
        set({ loading: true, error: null })
        try {
          const response = await api.register(data)
          setToken(response.token)
          set({ user: response.user, isAuthenticated: true, loading: false })
          return response.user
        } catch (err) {
          set({ error: err.message, loading: false })
          throw err
        }
      },

      logout: async () => {
        try {
          await api.logout()
        } catch {
          // ignore logout errors
        }
        setToken(null)
        set({ user: null, isAuthenticated: false })
      },

      checkAuth: async () => {
        const token = getToken()
        if (!token) {
          set({ user: null, isAuthenticated: false })
          return false
        }
        try {
          const user = await api.me()
          set({ user, isAuthenticated: true })
          return true
        } catch {
          setToken(null)
          set({ user: null, isAuthenticated: false })
          return false
        }
      },

      updateUser: (data) => set({ user: { ...get().user, ...data } }),
    }),
    {
      name: 'paytrack-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
