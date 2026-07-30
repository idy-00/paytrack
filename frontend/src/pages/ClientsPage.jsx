import { useState, useEffect } from 'react'
import { Plus, Search, Phone, Mail, MapPin, ArrowRight, Users, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useClientStore } from '@/store/clientStore'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'

const BLUE = '#1A56DB'

function initials(name = '') {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

const EMPTY_FORM = { name: '', phone: '', email: '', city: '', address: '' }

const FORM_FIELDS = [
  { id: 'f-name',    label: 'Nom complet',  field: 'name',    required: true,  type: 'text',  placeholder: 'Aminata Ndiaye'        },
  { id: 'f-phone',   label: 'Téléphone',    field: 'phone',   required: true,  type: 'tel',   placeholder: '+221 77 000 00 00'     },
  { id: 'f-email',   label: 'Email',        field: 'email',   required: false, type: 'email', placeholder: 'aminata@gmail.com'     },
  { id: 'f-city',    label: 'Ville',        field: 'city',    required: false, type: 'text',  placeholder: 'Dakar'                 },
  { id: 'f-address', label: 'Adresse',      field: 'address', required: false, type: 'text',  placeholder: 'Quartier, rue…'       },
]

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const { clients, loading, fetchClients, addClient } = useClientStore()

  useEffect(() => { fetchClients() }, [fetchClients])

  const update = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const filtered = (clients || []).filter(c => {
    const q = search.toLowerCase()
    return !q ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q)
  })

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Nom et téléphone requis.')
      return
    }
    setSaving(true)
    try {
      await addClient({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        city: form.city.trim() || 'Non renseigné',
        address: form.address.trim() || '',
      })
      setShowModal(false)
      setForm(EMPTY_FORM)
      toast.success(`Client "${form.name}" créé !`)
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  if (loading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clients.length} clients enregistrés</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary gap-2">
          <Plus size={16} /> Nouveau client
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Rechercher par nom, téléphone, ville…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      <div className="card hidden md:block overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr>
              {['Client', 'Téléphone', 'Email', 'Ville', 'Client depuis', ''].map(h => (
                <th key={h} className="table-header text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(client => (
              <tr key={client.id} className="table-row">
                <td className="table-cell">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: BLUE }}>
                      {initials(client.name)}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{client.name}</span>
                  </div>
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Phone size={12} className="text-gray-400" /> {client.phone}
                  </div>
                </td>
                <td className="table-cell text-gray-600">
                  {client.email ? (
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} className="text-gray-400" /> {client.email}
                    </div>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <MapPin size={12} className="text-gray-400" /> {client.city || '—'}
                  </div>
                </td>
                <td className="table-cell text-gray-500 text-sm">{formatDate(client.created_at)}</td>
                <td className="table-cell">
                  <button className="btn btn-ghost btn-icon btn-sm"><ArrowRight size={14} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <Users size={36} className="text-gray-200" />
                    <p className="text-sm font-medium">Aucun client trouvé.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {filtered.map(client => (
          <div key={client.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: BLUE }}>
                  {initials(client.name)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{client.name}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Phone size={11} /> {client.phone}</span>
                    {client.email && <span className="flex items-center gap-1 truncate"><Mail size={11} /> {client.email}</span>}
                    {client.city && <span className="flex items-center gap-1"><MapPin size={11} /> {client.city}</span>}
                  </div>
                </div>
              </div>
              <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
            </div>
            <p className="text-xs text-gray-400 mt-2.5">Client depuis {formatDate(client.created_at)}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card p-12 text-center">
            <Users size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Aucun client trouvé.</p>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nouveau client">
        <div className="space-y-4">
          {FORM_FIELDS.map(({ id, label, field, required, type, placeholder }) => (
            <div key={id}>
              <label htmlFor={id} className="block text-sm font-medium text-gray-900 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              <input
                id={id}
                type={type}
                className="input"
                value={form[field]}
                onChange={e => update(field, e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Annuler</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary flex-1 gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
