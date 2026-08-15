import { useState, useEffect } from 'react'
import { Truck, Search, Plus, Edit, Trash2, Phone, Mail, MapPin, Loader2, AlertTriangle, X } from 'lucide-react'
import { api } from '@/lib/api'
import { formatAmount } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([])
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [planRequired, setPlanRequired] = useState(false)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [suppliersRes, debtsRes] = await Promise.all([
        api.getSuppliers(),
        api.getSupplierDebts().catch(() => ({ data: [] })),
      ])
      setSuppliers(suppliersRes?.data || suppliersRes || [])
      setDebts(debtsRes?.suppliers || debtsRes?.data || [])
      setPlanRequired(false)
    } catch (err) {
      if (err.message?.includes('403') || err.response?.status === 403) {
        setPlanRequired(true)
      } else {
        toast.error('Erreur chargement')
      }
    } finally {
      setLoading(false)
    }
  }

  const filtered = suppliers.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  )

  const totalDebt = debts.reduce((sum, d) => sum + (d.debt_amount || 0), 0)

  const openModal = (supplier = null) => {
    if (supplier) {
      setEditing(supplier)
      setForm({
        name: supplier.name || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        notes: supplier.notes || '',
      })
    } else {
      setEditing(null)
      setForm({ name: '', phone: '', email: '', address: '', notes: '' })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) {
      toast.error('Nom requis')
      return
    }

    setSubmitting(true)
    try {
      if (editing) {
        await api.updateSupplier(editing.id, form)
        toast.success('Fournisseur modifié')
      } else {
        await api.createSupplier(form)
        toast.success('Fournisseur créé')
      }
      setShowModal(false)
      loadData()
    } catch (err) {
      toast.error(err.message || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce fournisseur ?')) return
    try {
      await api.deleteSupplier(id)
      toast.success('Fournisseur supprimé')
      loadData()
    } catch (err) {
      toast.error(err.message || 'Erreur')
    }
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
          Disponible uniquement sur le plan Business
        </h2>
        <p className="text-gray-500 mb-6">
          La gestion des fournisseurs, des commandes fournisseurs et du suivi des dettes est réservée aux abonnés du plan Business.
        </p>
        <a href="/abonnement" className="btn btn-primary">
          Passer au plan Business
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fournisseurs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez vos fournisseurs et leurs dettes</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} />
          Nouveau fournisseur
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Truck size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{suppliers.length}</p>
            <p className="text-xs text-gray-500">Fournisseurs</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <AlertTriangle size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{debts.filter(d => d.debt_amount > 0).length}</p>
            <p className="text-xs text-gray-500">Avec dette</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <span className="text-red-600 font-bold text-sm">FCFA</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{formatAmount(totalDebt)}</p>
            <p className="text-xs text-gray-500">Total dettes</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="Rechercher un fournisseur..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Suppliers list */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full card p-12 text-center text-gray-400">
            <Truck size={48} className="mx-auto mb-3 opacity-50" />
            <p>Aucun fournisseur</p>
          </div>
        ) : (
          filtered.map(supplier => {
            const debt = debts.find(d => d.supplier_id === supplier.id)
            const hasDebt = debt && debt.debt_amount > 0

            return (
              <div key={supplier.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Truck size={20} className="text-gray-600" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openModal(supplier)} className="btn btn-ghost btn-icon btn-sm">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(supplier.id)} className="btn btn-ghost btn-icon btn-sm text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900">{supplier.name}</h3>

                <div className="mt-3 space-y-1">
                  {supplier.phone && (
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Phone size={14} />
                      {supplier.phone}
                    </p>
                  )}
                  {supplier.email && (
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Mail size={14} />
                      {supplier.email}
                    </p>
                  )}
                  {supplier.address && (
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <MapPin size={14} />
                      {supplier.address}
                    </p>
                  )}
                </div>

                {hasDebt && (
                  <div className="mt-3 p-2 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">
                      Dette: {formatAmount(debt.debt_amount)}
                    </p>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                  <span>{supplier.orders_count || 0} commandes</span>
                  <span>Total: {formatAmount(supplier.total_orders_amount || 0)}</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
              </h2>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  className="input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  className="input"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input
                  type="text"
                  className="input"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="input"
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : editing ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
