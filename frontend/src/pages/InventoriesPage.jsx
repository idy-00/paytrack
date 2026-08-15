import { useState, useEffect } from 'react'
import { ClipboardCheck, Search, Plus, Eye, Clock, CheckCircle, XCircle, Loader2, Package, AlertTriangle, X } from 'lucide-react'
import { api } from '@/lib/api'
import { formatAmount } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  in_progress: { label: 'En cours', color: 'amber', icon: Clock },
  completed: { label: 'Terminé', color: 'green', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'red', icon: XCircle },
}

export default function InventoriesPage() {
  const [inventories, setInventories] = useState([])
  const [loading, setLoading] = useState(true)
  const [planRequired, setPlanRequired] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedInventory, setSelectedInventory] = useState(null)
  const [creating, setCreating] = useState(false)
  const [newInventory, setNewInventory] = useState({ name: '', notes: '' })
  const [products, setProducts] = useState([])
  const [countItems, setCountItems] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [invRes, prodRes] = await Promise.all([
        api.getInventories(),
        api.getArticles(),
      ])
      setInventories(invRes?.data || invRes || [])
      setProducts(prodRes?.data || prodRes || [])
      setPlanRequired(false)
    } catch (err) {
      const status = err.response?.status || (err.message?.includes('403') ? 403 : 0)
      const code = err.response?.data?.code

      if (status === 403 || code === 'feature_not_available') {
        setPlanRequired(true)
      } else {
        console.error('Inventories load error:', err)
        toast.error('Erreur chargement des inventaires')
      }
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    const items = products.map(p => ({
      article_id: p.id,
      name: p.name,
      system_quantity: p.stock || p.quantity || 0,
      counted_quantity: '',
    }))
    setCountItems(items)
    setNewInventory({ name: `Inventaire - ${new Date().toLocaleDateString('fr-FR')}`, notes: '' })
    setShowCreateModal(true)
  }

  const updateCount = (articleId, value) => {
    setCountItems(prev => prev.map(item =>
      item.article_id === articleId
        ? { ...item, counted_quantity: value }
        : item
    ))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newInventory.name) {
      toast.error('Nom requis')
      return
    }

    const itemsWithCount = countItems.filter(item => item.counted_quantity !== '' && item.counted_quantity !== null)
    if (itemsWithCount.length === 0) {
      toast.error('Comptez au moins un article')
      return
    }

    setCreating(true)
    try {
      const items = itemsWithCount.map(item => ({
        article_id: item.article_id,
        system_quantity: item.system_quantity,
        counted_quantity: parseInt(item.counted_quantity),
      }))
      await api.createInventory({
        name: newInventory.name,
        notes: newInventory.notes,
        items,
      })
      toast.success('Inventaire créé')
      setShowCreateModal(false)
      setNewInventory({ name: '', notes: '' })
      setCountItems([])
      loadData()
    } catch (err) {
      toast.error(err.message || 'Erreur')
    } finally {
      setCreating(false)
    }
  }

  const handleComplete = async (id) => {
    if (!confirm('Terminer cet inventaire ? Les écarts seront appliqués au stock.')) return
    try {
      await api.completeInventory(id)
      toast.success('Inventaire terminé, stock ajusté')
      loadData()
    } catch (err) {
      toast.error(err.message || 'Erreur')
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('Annuler cet inventaire ?')) return
    try {
      await api.cancelInventory(id)
      toast.success('Inventaire annulé')
      loadData()
    } catch (err) {
      toast.error(err.message || 'Erreur')
    }
  }

  const openDetail = async (inventory) => {
    try {
      const res = await api.getInventory(inventory.id)
      setSelectedInventory(res)
      setShowDetailModal(true)
    } catch (err) {
      toast.error('Erreur chargement détails')
    }
  }

  const updateItemCount = async (itemId, counted) => {
    try {
      await api.updateInventoryItem(selectedInventory.id, itemId, { counted_quantity: parseInt(counted) })
      const res = await api.getInventory(selectedInventory.id)
      setSelectedInventory(res)
    } catch (err) {
      toast.error('Erreur mise à jour')
    }
  }

  const stats = {
    inProgress: inventories.filter(i => i.status === 'in_progress').length,
    completed: inventories.filter(i => i.status === 'completed').length,
    totalAdjustments: inventories
      .filter(i => i.status === 'completed')
      .reduce((sum, i) => sum + Math.abs(i.total_adjustment || 0), 0),
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
          <AlertTriangle size={32} className="text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Disponible uniquement sur les plans Pro et Business
        </h2>
        <p className="text-gray-500 mb-6">
          La gestion des inventaires, le comptage du stock et les ajustements automatiques sont réservés aux abonnés des plans Pro et Business.
        </p>
        <a href="/abonnement" className="btn btn-primary">
          Passer au plan Pro
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventaires</h1>
          <p className="text-sm text-gray-500 mt-0.5">Comptez vos stocks et ajustez les écarts</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} />
          Nouvel inventaire
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Clock size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{stats.inProgress}</p>
            <p className="text-xs text-gray-500">En cours</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-gray-500">Terminés</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Package size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalAdjustments}</p>
            <p className="text-xs text-gray-500">Ajustements totaux</p>
          </div>
        </div>
      </div>

      {/* Inventories list */}
      <div className="card overflow-x-auto">
        {inventories.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <ClipboardCheck size={48} className="mx-auto mb-3 opacity-50" />
            <p>Aucun inventaire</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left">Nom</th>
                <th className="table-header text-left">Date</th>
                <th className="table-header text-left">Articles</th>
                <th className="table-header text-left">Écarts</th>
                <th className="table-header text-left">Statut</th>
                <th className="table-header text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventories.map(inventory => {
                const status = STATUS_CONFIG[inventory.status] || STATUS_CONFIG.in_progress
                const StatusIcon = status.icon

                return (
                  <tr key={inventory.id} className="table-row">
                    <td className="table-cell font-medium">{inventory.name}</td>
                    <td className="table-cell text-gray-600">
                      {new Date(inventory.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="table-cell">{inventory.items_count || 0} articles</td>
                    <td className="table-cell">
                      {inventory.total_adjustment !== 0 && inventory.total_adjustment !== undefined ? (
                        <span className={inventory.total_adjustment > 0 ? 'text-green-600' : 'text-red-600'}>
                          {inventory.total_adjustment > 0 ? '+' : ''}{inventory.total_adjustment}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
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
                        <button onClick={() => openDetail(inventory)} className="btn btn-ghost btn-icon btn-sm" title="Voir">
                          <Eye size={16} />
                        </button>
                        {inventory.status === 'in_progress' && (
                          <>
                            <button onClick={() => handleComplete(inventory.id)} className="btn btn-primary btn-sm text-xs">
                              Terminer
                            </button>
                            <button onClick={() => handleCancel(inventory.id)} className="btn btn-ghost btn-sm text-xs text-red-600">
                              Annuler
                            </button>
                          </>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Nouvel inventaire</h2>
                <p className="text-sm text-gray-500">Comptez vos articles et validez</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex-1 overflow-hidden flex flex-col">
              <div className="p-5 border-b bg-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      className="input"
                      value={newInventory.name}
                      onChange={e => setNewInventory({ ...newInventory, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Optionnel"
                      value={newInventory.notes}
                      onChange={e => setNewInventory({ ...newInventory, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Articles à compter</span>
                  <span className="text-xs text-gray-500">
                    {countItems.filter(i => i.counted_quantity !== '').length} / {countItems.length} comptés
                  </span>
                </div>

                {countItems.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    <Package size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Aucun article en stock</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {countItems.map(item => {
                      const counted = item.counted_quantity !== '' ? parseInt(item.counted_quantity) : null
                      const diff = counted !== null ? counted - item.system_quantity : null

                      return (
                        <div key={item.article_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500">Stock système: {item.system_quantity}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min="0"
                              className="input w-24 text-center"
                              placeholder="Compté"
                              value={item.counted_quantity}
                              onChange={e => updateCount(item.article_id, e.target.value)}
                            />
                            {diff !== null && (
                              <span className={`w-16 text-center text-sm font-semibold ${
                                diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'
                              }`}>
                                {diff > 0 ? '+' : ''}{diff}
                              </span>
                            )}
                            {diff === null && <span className="w-16" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-3 p-5 border-t bg-gray-50">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary flex-1">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating || countItems.filter(i => i.counted_quantity !== '').length === 0}
                  className="btn btn-primary flex-1"
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : 'Créer l\'inventaire'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedInventory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedInventory.name}</h2>
                <p className="text-sm text-gray-500">
                  {new Date(selectedInventory.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="btn btn-ghost btn-icon">
                <X size={18} />
              </button>
            </div>

            {selectedInventory.items?.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <Package size={32} className="mx-auto mb-2 opacity-50" />
                <p>Aucun article dans cet inventaire</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header text-left">Article</th>
                    <th className="table-header text-center">Stock système</th>
                    <th className="table-header text-center">Compté</th>
                    <th className="table-header text-center">Écart</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedInventory.items || []).map(item => {
                    const diff = (item.counted_quantity ?? item.system_quantity) - item.system_quantity

                    return (
                      <tr key={item.id} className="table-row">
                        <td className="table-cell font-medium">{item.article?.name || item.article_name}</td>
                        <td className="table-cell text-center text-gray-600">{item.system_quantity}</td>
                        <td className="table-cell text-center">
                          {selectedInventory.status === 'in_progress' ? (
                            <input
                              type="number"
                              min="0"
                              className="input w-20 text-center"
                              value={item.counted_quantity ?? ''}
                              onChange={e => updateItemCount(item.id, e.target.value)}
                              placeholder="-"
                            />
                          ) : (
                            <span>{item.counted_quantity ?? '-'}</span>
                          )}
                        </td>
                        <td className="table-cell text-center">
                          {item.counted_quantity !== null && item.counted_quantity !== undefined ? (
                            <span className={`font-medium ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                              {diff > 0 ? '+' : ''}{diff}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {selectedInventory.status === 'in_progress' && (
              <div className="mt-5 flex gap-3">
                <button onClick={() => handleCancel(selectedInventory.id)} className="btn btn-secondary flex-1">
                  Annuler l'inventaire
                </button>
                <button onClick={() => handleComplete(selectedInventory.id)} className="btn btn-primary flex-1">
                  Terminer et appliquer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
