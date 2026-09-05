import { useEffect, useState } from 'react'
import { Loader2, UserRound } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const user = useAuthStore(state => state.user)
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  useEffect(() => { api.me().then(data => setForm(current => ({ ...current, ...data }))).catch(error => toast.error(error.message || 'Profil indisponible')).finally(() => setLoading(false)) }, [])
  const submit = async event => {
    event.preventDefault(); setSaving(true)
    try { await api.updateProfile({ name: form.name, phone: form.phone || null }); toast.success('Profil mis à jour.') }
    catch (error) { toast.error(error.message || 'Mise à jour impossible') }
    finally { setSaving(false) }
  }
  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
  return <div className="max-w-xl mx-auto"><div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Mon profil</h1><p className="mt-1 text-sm text-gray-500">Gérez vos informations personnelles.</p></div><form className="card p-6 space-y-5" onSubmit={submit}><div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 grid place-items-center"><UserRound size={24}/></div><div><label htmlFor="profile-name" className="block text-sm font-medium mb-1">Nom complet</label><input id="profile-name" className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></div><div><label htmlFor="profile-email" className="block text-sm font-medium mb-1">E-mail</label><input id="profile-email" className="input bg-gray-50" value={form.email} disabled/><p className="mt-1 text-xs text-gray-500">L’adresse e-mail ne peut pas être modifiée ici.</p></div><div><label htmlFor="profile-phone" className="block text-sm font-medium mb-1">Téléphone</label><input id="profile-phone" className="input" inputMode="tel" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="77 123 45 67"/></div><button className="btn btn-primary gap-2" disabled={saving}>{saving && <Loader2 size={16} className="animate-spin"/>}Enregistrer</button></form></div>
}
