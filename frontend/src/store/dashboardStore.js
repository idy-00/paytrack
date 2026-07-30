import { create } from 'zustand'
import { api } from '@/lib/api'

export const useDashboardStore = create((set) => ({
  stats: null,
  sales: [],
  upcomingSchedules: [],
  activity: [],
  loading: false,
  error: null,

  fetchStats: async () => {
    set({ loading: true, error: null })
    try {
      const stats = await api.dashboardStats()
      set({ stats, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  fetchSales: async () => {
    try {
      const response = await api.getSales()
      set({ sales: response.data || response })
    } catch (err) {
      set({ error: err.message })
    }
  },

  fetchUpcoming: async () => {
    try {
      const schedules = await api.dashboardUpcoming()
      set({ upcomingSchedules: schedules })
    } catch (err) {
      set({ error: err.message })
    }
  },

  fetchActivity: async () => {
    try {
      const activity = await api.dashboardActivity()
      set({ activity })
    } catch (err) {
      set({ error: err.message })
    }
  },

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const [stats, salesRes, upcoming, activity] = await Promise.all([
        api.dashboardStats(),
        api.getSales(),
        api.dashboardUpcoming(),
        api.dashboardActivity(),
      ])
      set({
        stats,
        sales: salesRes.data || salesRes,
        upcomingSchedules: upcoming,
        activity,
        loading: false,
      })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },
}))
