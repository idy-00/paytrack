const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

let authToken = null

export function setToken(token) {
  authToken = token
  if (token) {
    localStorage.setItem('paytrack-token', token)
  } else {
    localStorage.removeItem('paytrack-token')
  }
}

export function getToken() {
  if (!authToken) {
    authToken = localStorage.getItem('paytrack-token')
  }
  return authToken
}

async function request(endpoint, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    setToken(null)
    window.location.href = '/login'
    throw new Error('Session expirée')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erreur serveur' }))
    throw new Error(error.message || `Erreur ${response.status}`)
  }

  if (response.status === 204) return null
  return response.json()
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (data) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  logout: () =>
    request('/auth/logout', { method: 'POST' }),

  me: () =>
    request('/auth/me'),

  // Dashboard
  dashboardStats: () => request('/dashboard/stats'),
  dashboardActivity: () => request('/dashboard/activity'),
  dashboardUpcoming: () => request('/dashboard/upcoming'),

  // Clients
  getClients: (params = '') => request(`/clients${params}`),
  getClient: (id) => request(`/clients/${id}`),
  createClient: (data) => request('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id, data) => request(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id) => request(`/clients/${id}`, { method: 'DELETE' }),

  // Articles
  getArticles: (params = '') => request(`/articles${params}`),
  getArticle: (id) => request(`/articles/${id}`),
  createArticle: (data) => request('/articles', { method: 'POST', body: JSON.stringify(data) }),
  updateArticle: (id, data) => request(`/articles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Sales
  getSales: (params = '') => request(`/sales${params}`),
  getSale: (id) => request(`/sales/${id}`),
  createSale: (data) => request('/sales', { method: 'POST', body: JSON.stringify(data) }),

  // Payments
  createPayment: (saleId, data) =>
    request(`/sales/${saleId}/payments`, { method: 'POST', body: JSON.stringify(data) }),

  initiateMobilePayment: (saleId, data) =>
    request(`/sales/${saleId}/mobile-payment`, { method: 'POST', body: JSON.stringify(data) }),

  // QR (public, no auth)
  getQrInfo: (uuid) => fetch(`${API_URL}/qr/${uuid}`).then(r => r.json()),

  // Shops
  getShops: () => request('/shops'),
  getShop: (id) => request(`/shops/${id}`),
  createShop: (data) => request('/shops', { method: 'POST', body: JSON.stringify(data) }),
  updateShop: (id, data) => request(`/shops/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Users
  getUsers: () => request('/users'),
  getUser: (id) => request(`/users/${id}`),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleUserActive: (id) => request(`/users/${id}/toggle-active`, { method: 'POST' }),
  assignRole: (id, role) => request(`/users/${id}/assign-role`, { method: 'POST', body: JSON.stringify({ role }) }),
  resetPassword: (id, password) => request(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) }),

  // Receipts (returns blob for download)
  getSaleReceipt: (id) => `${API_URL}/sales/${id}/receipt`,
  getPaymentReceipt: (id) => `${API_URL}/payments/${id}/receipt`,

  // Exports
  exportSales: (params = '') => `${API_URL}/exports/sales${params}`,
  exportPayments: (params = '') => `${API_URL}/exports/payments${params}`,
  exportOverdue: () => `${API_URL}/exports/overdue`,
}
