import { create } from 'zustand'
import { api } from '@/lib/api'

export const useSaleStore = create((set, get) => ({
  sales: [],
  loading: false,
  error: null,

  fetchSales: async (params = '') => {
    set({ loading: true, error: null })
    try {
      const response = await api.getSales(params)
      set({ sales: response.data || response, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  addSale: async (data) => {
    set({ loading: true, error: null })
    try {
      const sale = await api.createSale(data)
      set(state => ({ sales: [sale, ...state.sales], loading: false }))
      return sale
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  getSale: async (id) => {
    try {
      return await api.getSale(id)
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  recordPayment: async (saleId, data) => {
    try {
      const payment = await api.createPayment(saleId, data)
      // Refresh sale data after payment
      const updatedSale = await api.getSale(saleId)
      set(state => ({
        sales: state.sales.map(s => s.id === saleId ? updatedSale : s),
      }))
      return payment
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  updateSale: (id, updates) => set(state => ({
    sales: state.sales.map(s => s.id === id ? { ...s, ...updates } : s),
  })),
}))
