const API_URL = import.meta.env.VITE_API_URL || 'https://lightsalmon-eel-638395.hostingersite.com/backend/public/api'

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
    const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }))
    const error = new Error(errorData.message || `Erreur ${response.status}`)
    error.response = { status: response.status, data: errorData }
    throw error
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

  // Admin Stats (global across all shops)
  getAdminStats: () => request('/admin/stats'),
  getAdminReports: (params = '') => request(`/admin/reports${params}`),
  getAdminActivity: () => request('/admin/activity'),
  updateSettings: (data) => request('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),

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

  // Exports (download via fetch with auth header)
  downloadExport: async (endpoint) => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error('Export failed')
    const blob = await response.blob()
    const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'export.csv'
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  },
  exportSales: (params = '') => api.downloadExport(`/exports/sales${params}`),
  exportPayments: (params = '') => api.downloadExport(`/exports/payments${params}`),
  exportOverdue: () => api.downloadExport('/exports/overdue'),

  // ─── Subscription ───────────────────────────────────────────────────────────
  getPlans: () => fetch(`${API_URL}/plans`).then(r => r.json()),
  getSubscription: () => request('/subscription/current'),
  changePlan: (planId, billingCycle) => request('/subscription/change-plan', {
    method: 'POST', body: JSON.stringify({ plan_id: planId, billing_cycle: billingCycle })
  }),
  requestAssistedSetup: () => request('/subscription/assisted-setup', { method: 'POST' }),
  getInvoices: () => request('/subscription/invoices'),
  payInvoice: (invoiceId) => request(`/subscription/invoices/${invoiceId}/pay`, { method: 'POST' }),
  createRenewalInvoice: () => request('/subscription/renew', { method: 'POST' }),

  // ─── Wallet ─────────────────────────────────────────────────────────────────
  getWallet: () => request('/wallet'),
  getWalletTransactions: (params = '') => request(`/wallet/transactions${params}`),
  requestWithdrawal: (data) => request('/wallet/withdraw', { method: 'POST', body: JSON.stringify(data) }),
  getWithdrawals: () => request('/wallet/withdrawals'),

  // ─── KYC ────────────────────────────────────────────────────────────────────
  getKycStatus: () => request('/kyc/status'),
  uploadKycDocument: async (documentType, file) => {
    const token = getToken()
    const formData = new FormData()
    formData.append('document_type', documentType)
    formData.append('file', file)
    const response = await fetch(`${API_URL}/kyc/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Erreur upload' }))
      throw new Error(err.message || 'Erreur upload')
    }
    return response.json()
  },

  // ─── Orders (commandes clients) ─────────────────────────────────────────────
  getOrders: (params = '') => request(`/orders${params}`),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  recordOrderPayment: (orderId, data) => request(`/orders/${orderId}/payments`, { method: 'POST', body: JSON.stringify(data) }),
  initiateOrderPayment: (orderId, amount) => request(`/orders/${orderId}/pay-online`, { method: 'POST', body: JSON.stringify({ amount }) }),

  // ─── Stock ──────────────────────────────────────────────────────────────────
  getStockOverview: () => request('/stock/overview'),
  getStockMovements: (params = '') => request(`/stock/movements${params}`),
  adjustStock: (data) => request('/stock/adjust', { method: 'POST', body: JSON.stringify(data) }),
  getStockAlerts: () => request('/stock/alerts'),
  getTopSelling: (days = 30) => request(`/stock/top-selling?days=${days}`),

  // ─── Inventories ────────────────────────────────────────────────────────────
  getInventories: (params = '') => request(`/inventories${params}`),
  getInventory: (id) => request(`/inventories/${id}`),
  createInventory: (data) => request('/inventories', { method: 'POST', body: JSON.stringify(data) }),
  updateInventoryItem: (invId, itemId, data) => request(`/inventories/${invId}/items/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }),
  completeInventory: (id) => request(`/inventories/${id}/complete`, { method: 'POST' }),
  cancelInventory: (id) => request(`/inventories/${id}`, { method: 'DELETE' }),

  // ─── Suppliers ──────────────────────────────────────────────────────────────
  getSuppliers: (params = '') => request(`/suppliers${params}`),
  getSupplier: (id) => request(`/suppliers/${id}`),
  createSupplier: (data) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id, data) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),
  getSupplierDebts: () => request('/suppliers-debts'),

  // ─── Supplier Orders ────────────────────────────────────────────────────────
  getSupplierOrders: (params = '') => request(`/supplier-orders${params}`),
  getSupplierOrder: (id) => request(`/supplier-orders/${id}`),
  createSupplierOrder: (data) => request('/supplier-orders', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplierOrderStatus: (id, status) => request(`/supplier-orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  receiveSupplierItems: (orderId, items) => request(`/supplier-orders/${orderId}/receive`, { method: 'POST', body: JSON.stringify({ items }) }),
  recordSupplierPayment: (orderId, data) => request(`/supplier-orders/${orderId}/payments`, { method: 'POST', body: JSON.stringify(data) }),
}
