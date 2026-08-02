import { useState, useEffect } from 'react'
import { Store, Plus, Edit2, Loader2, Users, ShoppingBag, MapPin, Phone } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export default function ShopsPage() {
  const { user } = useAuthStore()
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingShop, setEditingShop] = useState(null)
  const [form, setForm] = useState({ name: '', address: '', city: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const canManage = user?.role === 'admin_entreprise' || user?.role === 'super_admin'

  useEffect(() => {
    fetchShops()
  }, [])

  async function fetchShops() {
    try {
      const data = await api.getShops()
      setShops(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingShop(null)
    setForm({ name: '', address: '', city: '', phone: '' })
    setShowModal(true)
  }

  function openEdit(shop) {
    setEditingShop(shop)
    setForm({ name: shop.name, address: shop.address || '', city: shop.city || '', phone: shop.phone || '' })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (editingShop) {
        await api.updateShop(editingShop.id, form)
      } else {
        await api.createShop(form)
      }
      setShowModal(false)
      fetchShops()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Boutiques</h1>
          <p className="text-sm text-gray-500 mt-1">Gérer les points de vente</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="btn btn-primary gap-2">
            <Plus size={16} /> Nouvelle boutique
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {shops.map(shop => (
          <div key={shop.id} className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Store size={22} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{shop.name}</h3>
                  {shop.city && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} /> {shop.city}
                    </p>
                  )}
                </div>
              </div>
              {canManage && (
                <button onClick={() => openEdit(shop)} className="btn btn-ghost btn-icon btn-sm">
                  <Edit2 size={14} />
                </button>
              )}
            </div>

            {shop.address && (
              <p className="text-sm text-gray-600 mb-3">{shop.address}</p>
            )}

            {shop.phone && (
              <p className="text-sm text-gray-500 flex items-center gap-2 mb-4">
                <Phone size={14} /> {shop.phone}
              </p>
            )}

            <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm">
                <Users size={14} className="text-gray-400" />
                <span className="font-medium">{shop.users_count || 0}</span>
                <span className="text-gray-400">utilisateurs</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ShoppingBag size={14} className="text-gray-400" />
                <span className="font-medium">{shop.sales_count || 0}</span>
                <span className="text-gray-400">ventes</span>
              </div>
            </div>

            <div className="mt-3">
              <span className={`text-xs px-2 py-1 rounded-full ${shop.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {shop.is_active !== false ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {shops.length === 0 && (
        <div className="card p-12 text-center">
          <Store size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune boutique</h3>
          <p className="text-gray-500 mb-4">Créez votre première boutique pour commencer</p>
          {canManage && (
            <button onClick={openCreate} className="btn btn-primary">
              <Plus size={16} /> Créer une boutique
            </button>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold">
                {editingShop ? 'Modifier la boutique' : 'Nouvelle boutique'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : (editingShop ? 'Modifier' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
