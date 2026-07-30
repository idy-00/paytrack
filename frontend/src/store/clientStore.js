import { create } from 'zustand'
import { api } from '@/lib/api'

export const useClientStore = create((set, get) => ({
  clients: [],
  loading: false,
  error: null,

  fetchClients: async (search = '') => {
    set({ loading: true, error: null })
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : ''
      const response = await api.getClients(params)
      set({ clients: response.data || response, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  addClient: async (data) => {
    set({ loading: true, error: null })
    try {
      const client = await api.createClient(data)
      set(state => ({ clients: [client, ...state.clients], loading: false }))
      return client
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  updateClient: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const client = await api.updateClient(id, data)
      set(state => ({
        clients: state.clients.map(c => c.id === id ? client : c),
        loading: false,
      }))
      return client
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  removeClient: async (id) => {
    try {
      await api.deleteClient(id)
      set(state => ({ clients: state.clients.filter(c => c.id !== id) }))
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  getClient: (id) => get().clients.find(c => c.id === id),
}))
