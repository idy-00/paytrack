import { useState, useEffect } from 'react'
import { Package, AlertTriangle, XCircle, Plus, Minus, Search, Loader2 } from 'lucide-react'
import { formatAmount } from '@/lib/utils'
import { useStockStore } from '@/store/stockStore'
import toast from 'react-hot-toast'

export default function StockPage() {
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editQty, setEditQty] = useState(0)

  const { articles, loading, fetchArticles, updateStock, lowStockThreshold } = useStockStore()

  useEffect(() => { fetchArticles() }, [fetchArticles])

  const filtered = (articles || []).filter(a => {
    const q = search.toLowerCase()
    return !q || (a.name || '').toLowerCase().includes(q) || (a.category || '').toLowerCase().includes(q)
  })

  const totalItems = filtered.reduce((acc, a) => acc + (a.stock || 0), 0)
  const lowStockCount = filtered.filter(a => a.stock > 0 && a.stock <= lowStockThreshold).length
  const outOfStockCount = filtered.filter(a => (a.stock || 0) <= 0).length

  const handleSaveStock = async (articleId) => {
    try {
      await updateStock(articleId, editQty)
      setEditingId(null)
      toast.success('Stock mis à jour.')
    } catch (err) {
      toast.error(err.message || 'Erreur')
    }
  }

  const handleQuickAdd = async (articleId, delta) => {
    const article = articles.find(a => a.id === articleId)
    const newStock = Math.max(0, (article?.stock || 0) + delta)
    try {
      await updateStock(articleId, newStock)
      toast.success(delta > 0 ? `+${delta} ajouté.` : `-${Math.abs(delta)} retiré.`)
    } catch (err) {
      toast.error(err.message || 'Erreur')
    }
  }

  if (loading && articles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion du stock</h1>
        <p className="text-sm text-gray-500 mt-0.5">Suivez les quantités et gérez vos approvisionnements.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Package size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            <p className="text-xs text-gray-500">Articles en stock</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <AlertTriangle size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
            <p className="text-xs text-gray-500">Stock bas</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <XCircle size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
            <p className="text-xs text-gray-500">En rupture</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input type="search" placeholder="Rechercher un article…" value={search}
          onChange={e => setSearch(e.target.value)} className="input pl-10" />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr>
              {['Article', 'Catégorie', 'Prix', 'Quantité', 'Statut', 'Actions'].map(h => (
                <th key={h} className="table-header text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(article => {
              const qty = article.stock || 0
              const low = qty > 0 && qty <= lowStockThreshold
              const out = qty <= 0
              const isEditing = editingId === article.id

              return (
                <tr key={article.id} className="table-row">
                  <td className="table-cell"><p className="text-sm font-medium text-gray-900">{article.name}</p></td>
                  <td className="table-cell text-sm text-gray-600">{article.category || '—'}</td>
                  <td className="table-cell"><span className="amount font-medium text-gray-900">{formatAmount(article.price)}</span></td>
                  <td className="table-cell">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input type="number" min={0} className="input w-20 text-center text-sm" value={editQty}
                          onChange={e => setEditQty(Math.max(0, Number(e.target.value)))} autoFocus />
                        <button onClick={() => handleSaveStock(article.id)} className="btn btn-primary btn-sm text-xs">OK</button>
                        <button onClick={() => setEditingId(null)} className="btn btn-ghost btn-sm text-xs">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingId(article.id); setEditQty(qty) }}
                        className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                        {qty}
                      </button>
                    )}
                  </td>
                  <td className="table-cell">
                    {out ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                        <XCircle size={12} /> Rupture
                      </span>
                    ) : low ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                        <AlertTriangle size={12} /> Stock bas
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        ✓ En stock
                      </span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button onClick={() => handleQuickAdd(article.id, 1)} className="btn btn-ghost btn-icon btn-sm" title="Ajouter 1">
                        <Plus size={14} />
                      </button>
                      <button onClick={() => { if (qty > 0) handleQuickAdd(article.id, -1) }} disabled={qty <= 0}
                        className="btn btn-ghost btn-icon btn-sm" title="Retirer 1">
                        <Minus size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-16 text-center text-gray-400">Aucun article trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
