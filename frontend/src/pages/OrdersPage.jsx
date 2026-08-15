import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Search, Plus, Eye, Clock, CheckCircle, Package, Truck, XCircle, Loader2, Filter } from 'lucide-react'
import { api } from '@/lib/api'
import { formatAmount } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'gray', icon: Clock },
  confirmed: { label: 'Confirmée', color: 'blue', icon: CheckCircle },
  preparing: { label: 'En préparation', color: 'amber', icon: Package },
  ready: { label: 'Prête', color: 'purple', icon: Package },
  delivered: { label: 'Livrée', color: 'green', icon: Truck },
  cancelled: { label: 'Annulée', color: 'red', icon: XCircle },
}

const PAYMENT_STATUS = {
  pending: { label: 'Non payée', color: 'gray' },
  partial: { label: 'Partiel', color: 'amber' },
  paid: { label: 'Payée', color: 'green' },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 })

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  const loadOrders = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (search) params.append('search', search)
      params.append('page', page)

      const res = await api.getOrders(`?${params.toString()}`)
      setOrders(res?.data || [])
      setPagination({ current_page: res?.current_page || 1, last_page: res?.last_page || 1 })
    } catch (err) {
      toast.error('Erreur chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadOrders()
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus)
      toast.success('Statut mis à jour')
      loadOrders(pagination.current_page)
    } catch (err) {
      toast.error(err.message || 'Erreur')
    }
  }

  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez les commandes de vos clients</p>
        </div>
        <Link to="/commandes/nouvelle" className="btn btn-primary flex items-center gap-2">
          <Plus size={16} />
          Nouvelle commande
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Clock size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            <p className="text-xs text-gray-500">En attente</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Package size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
            <p className="text-xs text-gray-500">En cours</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Truck size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
            <p className="text-xs text-gray-500">Livrées</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Rechercher (réf, client)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10"
          />
        </form>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input w-48"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* Orders table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <ShoppingCart size={48} className="mx-auto mb-3 opacity-50" />
            <p>Aucune commande</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left">Référence</th>
                <th className="table-header text-left">Client</th>
                <th className="table-header text-left">Date</th>
                <th className="table-header text-left">Montant</th>
                <th className="table-header text-left">Paiement</th>
                <th className="table-header text-left">Statut</th>
                <th className="table-header text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                const payment = PAYMENT_STATUS[order.payment_status] || PAYMENT_STATUS.pending
                const StatusIcon = status.icon

                return (
                  <tr key={order.id} className="table-row">
                    <td className="table-cell">
                      <span className="font-mono text-sm font-medium">{order.reference}</span>
                    </td>
                    <td className="table-cell">
                      <p className="font-medium text-gray-900">{order.client?.full_name}</p>
                    </td>
                    <td className="table-cell text-gray-600">
                      {new Date(order.order_date || order.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="table-cell font-medium">{formatAmount(order.total_amount)}</td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-${payment.color}-100 text-${payment.color}-700`}>
                        {payment.label}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-${status.color}-100 text-${status.color}-700`}>
                        <StatusIcon size={12} />
                        {status.label}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Link to={`/commandes/${order.id}`} className="btn btn-ghost btn-icon btn-sm" title="Voir">
                          <Eye size={16} />
                        </Link>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'confirmed')}
                            className="btn btn-primary btn-sm text-xs"
                          >
                            Confirmer
                          </button>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'preparing')}
                            className="btn btn-secondary btn-sm text-xs"
                          >
                            Préparer
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'ready')}
                            className="btn btn-secondary btn-sm text-xs"
                          >
                            Prêt
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'delivered')}
                            className="btn btn-primary btn-sm text-xs"
                          >
                            Livrer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => loadOrders(page)}
              className={`w-10 h-10 rounded-lg font-medium ${page === pagination.current_page ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
