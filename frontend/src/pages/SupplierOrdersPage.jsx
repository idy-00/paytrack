import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Search, Plus, Eye, Clock, CheckCircle, Package, XCircle, Loader2, Truck, Lock, Trash2, X } from 'lucide-react'
import { api } from '@/lib/api'
import { formatAmount } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'gray', icon: Clock },
  ordered: { label: 'Commandée', color: 'blue', icon: ClipboardList },
  partial: { label: 'Partielle', color: 'amber', icon: Package },
  received: { label: 'Reçue', color: 'green', icon: CheckCircle },
  cancelled: { label: 'Annulée', color: 'red', icon: XCircle },
}

export default function SupplierOrdersPage() {
  const [orders, setOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [planRequired, setPlanRequired] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newOrder, setNewOrder] = useState({ supplier_id: '', notes: '', items: [] })
  const [showNewArticleModal, setShowNewArticleModal] = useState(false)
  const [newArticle, setNewArticle] = useState({ name: '', price: '', purchase_price: '' })
  const [creatingArticle, setCreatingArticle] = useState(false)

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const loadData = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (search) params.append('search', search)

      const [ordersRes, suppliersRes, productsRes] = await Promise.all([
        api.getSupplierOrders(`?${params.toString()}`),
        api.getSuppliers(),
        api.getArticles(),
      ])
      setOrders(ordersRes?.data || ordersRes || [])
      setSuppliers(suppliersRes?.data || suppliersRes || [])
      setProducts(productsRes?.data || productsRes || [])
      setPlanRequired(null)
    } catch (err) {
      if (err.response?.status === 403 || err.message?.includes('403')) {
        setPlanRequired('Business')
      } else {
        toast.error('Erreur chargement')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.updateSupplierOrderStatus(orderId, newStatus)
      toast.success('Statut mis à jour')
      loadData()
    } catch (err) {
      toast.error(err.message || 'Erreur')
    }
  }

  const handleCreateOrder = async (e) => {
    e.preventDefault()
    if (!newOrder.supplier_id) {
      toast.error('Sélectionnez un fournisseur')
      return
    }
    if (newOrder.items.length === 0) {
      toast.error('Ajoutez au moins un article')
      return
    }

    setCreating(true)
    try {
      const items = newOrder.items.map(item => ({
        article_id: item.article_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
      }))
      const res = await api.createSupplierOrder({
        supplier_id: parseInt(newOrder.supplier_id),
        notes: newOrder.notes,
        items,
        status: 'ordered',
      })
      toast.success('Bon de commande créé')
      setShowCreateModal(false)
      setNewOrder({ supplier_id: '', notes: '', items: [] })
      loadData()
    } catch (err) {
      toast.error(err.message || 'Erreur')
    } finally {
      setCreating(false)
    }
  }

  const addItem = () => {
    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, { article_id: '', quantity: 1, unit_cost: 0, name: '' }]
    }))
  }

  const updateItem = (index, field, value) => {
    setNewOrder(prev => {
      const items = [...prev.items]
      items[index] = { ...items[index], [field]: value }
      if (field === 'article_id' && value) {
        const product = products.find(p => p.id === parseInt(value))
        if (product) {
          items[index].name = product.name
          items[index].unit_cost = product.purchase_price || product.price || 0
        }
      }
      return { ...prev, items }
    })
  }

  const removeItem = (index) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const orderTotal = newOrder.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0)

  const handleCreateArticle = async (e) => {
    e.preventDefault()
    if (!newArticle.name) {
      toast.error('Nom requis')
      return
    }
    setCreatingArticle(true)
    try {
      const res = await api.createArticle({
        name: newArticle.name,
        price: parseInt(newArticle.price) || 0,
        purchase_price: parseInt(newArticle.purchase_price) || 0,
        quantity: 0,
      })
      const created = res.article || res
      setProducts(prev => [...prev, created])
      toast.success('Article créé')
      setShowNewArticleModal(false)
      setNewArticle({ name: '', price: '', purchase_price: '' })
    } catch (err) {
      toast.error(err.message || 'Erreur')
    } finally {
      setCreatingArticle(false)
    }
  }

  const stats = {
    pending: orders.filter(o => ['draft', 'ordered'].includes(o.status)).length,
    partial: orders.filter(o => o.status === 'partial').length,
    received: orders.filter(o => o.status === 'received').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (planRequired) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock size={32} className="text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Disponible uniquement sur le plan {planRequired}
        </h2>
        <p className="text-gray-500 mb-6">
          La gestion des commandes fournisseurs, des dettes et des réceptions de stock est réservée aux abonnés du plan Business.
        </p>
        <a href="/abonnement" className="btn btn-primary">
          Passer au plan {planRequired}
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commandes fournisseurs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez vos bons de commande</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} />
          Nouveau bon de commande
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <ClipboardList size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            <p className="text-xs text-gray-500">En cours</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Package size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{stats.partial}</p>
            <p className="text-xs text-gray-500">Partielles</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{stats.received}</p>
            <p className="text-xs text-gray-500">Reçues</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
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
        {orders.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <ClipboardList size={48} className="mx-auto mb-3 opacity-50" />
            <p>Aucune commande fournisseur</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left">Référence</th>
                <th className="table-header text-left">Fournisseur</th>
                <th className="table-header text-left">Date</th>
                <th className="table-header text-left">Montant</th>
                <th className="table-header text-left">Payé</th>
                <th className="table-header text-left">Statut</th>
                <th className="table-header text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.draft
                const StatusIcon = status.icon
                const remaining = (order.total_amount || 0) - (order.paid_amount || 0)

                return (
                  <tr key={order.id} className="table-row">
                    <td className="table-cell">
                      <span className="font-mono text-sm font-medium">{order.reference}</span>
                    </td>
                    <td className="table-cell">
                      <p className="font-medium text-gray-900">{order.supplier?.name}</p>
                    </td>
                    <td className="table-cell text-gray-600">
                      {new Date(order.order_date || order.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="table-cell font-medium">{formatAmount(order.total_amount || 0)}</td>
                    <td className="table-cell">
                      {remaining > 0 ? (
                        <span className="text-amber-600">{formatAmount(order.paid_amount || 0)}</span>
                      ) : (
                        <span className="text-green-600">Soldé</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-${status.color}-100 text-${status.color}-700`}>
                        <StatusIcon size={12} />
                        {status.label}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Link to={`/commandes-fournisseurs/${order.id}`} className="btn btn-ghost btn-icon btn-sm" title="Voir">
                          <Eye size={16} />
                        </Link>
                        {order.status === 'ordered' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'received')}
                            className="btn btn-primary btn-sm text-xs"
                          >
                            Réceptionner
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-gray-900">Nouveau bon de commande</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Fournisseur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur *</label>
                <select
                  className="input"
                  value={newOrder.supplier_id}
                  onChange={e => setNewOrder({ ...newOrder, supplier_id: e.target.value })}
                  required
                >
                  <option value="">Sélectionner un fournisseur</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Articles */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Articles à commander *</label>
                  <button type="button" onClick={addItem} className="btn btn-ghost btn-sm text-blue-600 flex items-center gap-1">
                    <Plus size={14} />
                    Ajouter
                  </button>
                </div>

                {newOrder.items.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <Package size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">Aucun article</p>
                    <button type="button" onClick={addItem} className="mt-2 text-sm text-blue-600 font-medium">
                      + Ajouter un article
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {newOrder.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-start bg-gray-50 p-3 rounded-xl">
                        <div className="flex-1 flex gap-1">
                          <select
                            className="input text-sm flex-1"
                            value={item.article_id}
                            onChange={e => updateItem(idx, 'article_id', e.target.value)}
                            required
                          >
                            <option value="">Sélectionner un article</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setShowNewArticleModal(true)}
                            className="btn btn-ghost btn-icon btn-sm text-green-600 border border-green-200 hover:bg-green-50"
                            title="Nouvel article"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <div className="w-20">
                          <input
                            type="number"
                            className="input text-sm text-center"
                            placeholder="Qté"
                            min="1"
                            value={item.quantity}
                            onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                            required
                          />
                        </div>
                        <div className="w-28">
                          <input
                            type="number"
                            className="input text-sm"
                            placeholder="Prix achat"
                            min="0"
                            value={item.unit_cost}
                            onChange={e => updateItem(idx, 'unit_cost', parseInt(e.target.value) || 0)}
                            required
                          />
                        </div>
                        <button type="button" onClick={() => removeItem(idx)} className="btn btn-ghost btn-icon btn-sm text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              {newOrder.items.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Total commande</span>
                    <span className="text-xl font-bold text-blue-600">{formatAmount(orderTotal)}</span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Instructions, remarques..."
                  value={newOrder.notes}
                  onChange={e => setNewOrder({ ...newOrder, notes: e.target.value })}
                />
              </div>
            </form>

            <div className="flex gap-3 p-5 border-t bg-gray-50">
              <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary flex-1">
                Annuler
              </button>
              <button onClick={handleCreateOrder} disabled={creating || newOrder.items.length === 0} className="btn btn-primary flex-1">
                {creating ? <Loader2 size={16} className="animate-spin" /> : 'Créer la commande'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Article Modal */}
      {showNewArticleModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Nouvel article</h3>
              <button onClick={() => setShowNewArticleModal(false)} className="btn btn-ghost btn-icon btn-sm">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateArticle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: iPhone 16 Pro Max"
                  value={newArticle.name}
                  onChange={e => setNewArticle({ ...newArticle, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix achat (FCFA)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0"
                    value={newArticle.purchase_price}
                    onChange={e => setNewArticle({ ...newArticle, purchase_price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix vente (FCFA)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0"
                    value={newArticle.price}
                    onChange={e => setNewArticle({ ...newArticle, price: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewArticleModal(false)} className="btn btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" disabled={creatingArticle} className="btn btn-primary flex-1">
                  {creatingArticle ? <Loader2 size={16} className="animate-spin" /> : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
