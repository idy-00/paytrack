import { useState, useEffect } from 'react'
import { Users, Plus, Edit2, Loader2, Shield, ToggleLeft, ToggleRight, Key, Store } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const ROLES = [
  { value: 'vendeur', label: 'Vendeur' },
  { value: 'responsable_boutique', label: 'Responsable boutique' },
  { value: 'admin_entreprise', label: 'Admin entreprise' },
]

const ROLE_COLORS = {
  vendeur: 'bg-blue-100 text-blue-700',
  responsable_boutique: 'bg-purple-100 text-purple-700',
  admin_entreprise: 'bg-amber-100 text-amber-700',
  super_admin: 'bg-red-100 text-red-700',
}

export default function UsersPage() {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState([])
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [targetUser, setTargetUser] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', shop_id: '', role: 'vendeur' })
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const canManage = currentUser?.role === 'admin_entreprise' || currentUser?.role === 'super_admin'

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [usersData, shopsData] = await Promise.all([api.getUsers(), api.getShops()])
      setUsers(usersData)
      setShops(shopsData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingUser(null)
    setForm({ name: '', email: '', phone: '', password: '', shop_id: '', role: 'vendeur' })
    setShowModal(true)
  }

  function openEdit(user) {
    setEditingUser(user)
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      shop_id: user.shop_id || '',
      role: user.role || 'vendeur',
    })
    setShowModal(true)
  }

  function openPasswordReset(user) {
    setTargetUser(user)
    setNewPassword('')
    setShowPasswordModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const data = { ...form }
      if (!data.password) delete data.password
      if (!data.shop_id) delete data.shop_id

      if (editingUser) {
        await api.updateUser(editingUser.id, data)
        if (form.role !== editingUser.role) {
          await api.assignRole(editingUser.id, form.role)
        }
      } else {
        await api.createUser(data)
      }
      setShowModal(false)
      fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(user) {
    try {
      await api.toggleUserActive(user.id)
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handlePasswordReset(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.resetPassword(targetUser.id, newPassword)
      setShowPasswordModal(false)
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">Gérer les accès de votre équipe</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="btn btn-primary gap-2">
            <Plus size={16} /> Nouvel utilisateur
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Utilisateur</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rôle</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Boutique</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
              {canManage && <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
                    {ROLES.find(r => r.value === user.role)?.label || user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {user.shop ? (
                    <span className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Store size={14} className="text-gray-400" />
                      {user.shop}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {user.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                {canManage && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(user)}
                        className="btn btn-ghost btn-icon btn-sm"
                        title="Modifier"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => openPasswordReset(user)}
                        className="btn btn-ghost btn-icon btn-sm"
                        title="Réinitialiser mot de passe"
                      >
                        <Key size={14} />
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleToggleActive(user)}
                          className="btn btn-ghost btn-icon btn-sm"
                          title={user.is_active ? 'Désactiver' : 'Activer'}
                        >
                          {user.is_active ? <ToggleRight size={16} className="text-green-600" /> : <ToggleLeft size={16} className="text-gray-400" />}
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="card p-12 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun utilisateur</h3>
          <p className="text-gray-500">Invitez votre équipe pour commencer</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold">
                {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="input"
                  required
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
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="input"
                    required={!editingUser}
                    minLength={8}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
                  <select
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    className="input"
                    required
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Boutique</label>
                  <select
                    value={form.shop_id}
                    onChange={e => setForm({ ...form, shop_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Aucune</option>
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : (editingUser ? 'Modifier' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Réinitialiser le mot de passe</h2>
              <p className="text-sm text-gray-500 mt-1">Pour {targetUser?.name}</p>
            </div>
            <form onSubmit={handlePasswordReset} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="input"
                  required
                  minLength={8}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="btn btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : 'Réinitialiser'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
