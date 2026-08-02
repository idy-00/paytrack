import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Check, User, Package,
  CalendarDays, CreditCard, Loader2, Plus, UserPlus,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatAmount } from '@/lib/utils'
import { useClientStore } from '@/store/clientStore'
import { useStockStore } from '@/store/stockStore'
import { useSaleStore } from '@/store/saleStore'
import Modal from '@/components/ui/Modal'

const BLUE = '#1A56DB'
const SUCCESS = '#16A34A'

const STEPS = [
  { id: 1, label: 'Client',        icon: User        },
  { id: 2, label: 'Article',       icon: Package     },
  { id: 3, label: 'Conditions',    icon: CalendarDays },
  { id: 4, label: 'Récapitulatif', icon: CreditCard  },
]

const FREQUENCIES = [
  { value: 'hebdomadaire', label: 'Hebdomadaire' },
  { value: 'mensuel',      label: 'Mensuel' },
  { value: 'bimestriel',   label: 'Toutes les 2 semaines' },
  { value: 'trimestriel',  label: 'Trimestriel' },
  { value: 'personnalise', label: 'Personnalisé' },
]

const PAYMENT_MODES = [
  { value: 'tranche',  label: 'Paiement par tranche', desc: 'Échéancier avec acompte + tranches' },
  { value: 'comptant', label: 'Paiement comptant',    desc: 'Paiement intégral en une fois' },
]

const CLIENT_FORM_FIELDS = [
  { id: 'nc-name',    label: 'Nom complet',  field: 'name',    required: true,  type: 'text',  placeholder: 'Aminata Ndiaye' },
  { id: 'nc-phone',   label: 'Téléphone',    field: 'phone',   required: true,  type: 'tel',   placeholder: '+221 77 000 00 00' },
  { id: 'nc-email',   label: 'Email',        field: 'email',   required: false, type: 'email', placeholder: 'aminata@gmail.com' },
  { id: 'nc-city',    label: 'Ville',        field: 'city',    required: false, type: 'text',  placeholder: 'Dakar' },
  { id: 'nc-address', label: 'Adresse',      field: 'address', required: false, type: 'text',  placeholder: 'Quartier, rue…' },
]

function initials(name = '') {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function StepIndicator({ current }) {
  return (
    <nav className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const done = step.id < current
        const active = step.id === current
        const Icon = step.icon
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{ background: active ? BLUE : done ? '#DCFCE7' : 'transparent', color: active ? 'white' : done ? SUCCESS : '#9CA3AF' }}>
              {done ? <Check size={13} /> : <Icon size={13} />}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="w-8 h-px mx-1" style={{ background: step.id < current ? SUCCESS : '#E5E7EB' }} />}
          </div>
        )
      })}
    </nav>
  )
}

export default function NouvelleVentePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showNewClient, setShowNewClient] = useState(false)
  const [clientForm, setClientForm] = useState({ name: '', phone: '', email: '', city: '', address: '' })
  const [savingClient, setSavingClient] = useState(false)

  const { clients, fetchClients, addClient } = useClientStore()
  const { articles, fetchArticles, getArticleStock } = useStockStore()
  const { addSale } = useSaleStore()

  useEffect(() => {
    fetchClients()
    fetchArticles()
  }, [fetchClients, fetchArticles])

  const [form, setForm] = useState({
    client_id: '', article_id: '', total_amount: '', down_payment: '',
    installment_count: 3, frequency: 'mensuel', custom_days: 14,
    start_date: new Date().toISOString().split('T')[0], payment_mode: 'tranche',
  })

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const selectedClient = (clients || []).find(c => String(c.id) === form.client_id)
  const selectedArticle = (articles || []).find(a => String(a.id) === form.article_id)

  const totalNum = Number(form.total_amount) || 0
  const downNum = Number(form.down_payment) || 0
  const remainingAfterDown = totalNum - downNum
  const installmentAmount = form.installment_count > 0 ? Math.ceil(remainingAfterDown / form.installment_count) : 0
  const isComptant = form.payment_mode === 'comptant'

  const canNext = () => {
    if (step === 1) return !!form.client_id
    if (step === 2) {
      if (!form.article_id) return false
      const stock = getArticleStock(Number(form.article_id))
      if (stock !== null && stock <= 0) return false
      return true
    }
    if (step === 3) {
      if (isComptant) return totalNum > 0
      return totalNum > 0 && downNum >= 0 && downNum < totalNum && form.installment_count >= 1
    }
    return true
  }

  const handleSaveClient = async () => {
    if (!clientForm.name.trim() || !clientForm.phone.trim()) {
      toast.error('Nom et téléphone requis.')
      return
    }
    setSavingClient(true)
    try {
      const newClient = await addClient({
        full_name: clientForm.name.trim(),
        phone: clientForm.phone.trim(),
        email: clientForm.email.trim() || null,
        city: clientForm.city.trim() || 'Non renseigné',
        address: clientForm.address.trim() || '',
      })
      update('client_id', String(newClient.id))
      setShowNewClient(false)
      setClientForm({ name: '', phone: '', email: '', city: '', address: '' })
      toast.success(`Client "${newClient.name}" créé et sélectionné !`)
    } catch (err) {
      toast.error(err.message || 'Erreur création client')
    } finally {
      setSavingClient(false)
    }
  }

  const handleSubmit = async () => {
    if (!isComptant) {
      const stock = getArticleStock(Number(form.article_id))
      if (stock !== null && stock <= 0) {
        toast.error('Stock insuffisant.')
        return
      }
    }
    setLoading(true)
    try {
      await addSale({
        client_id: Number(form.client_id),
        article_id: Number(form.article_id),
        total_amount: totalNum,
        down_payment: isComptant ? totalNum : downNum,
        installment_count: isComptant ? 1 : form.installment_count,
        frequency: isComptant ? 'mensuel' : form.frequency,
        start_date: form.start_date,
        payment_mode: form.payment_mode,
      })
      toast.success(isComptant ? 'Vente comptant créée !' : 'Vente par tranche créée !')
      navigate('/ventes')
    } catch (err) {
      toast.error(err.message || 'Erreur création vente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-8">
      <button onClick={() => navigate('/ventes')} className="btn btn-ghost gap-2 mb-6 -ml-1">
        <ArrowLeft size={16} /> Retour aux ventes
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nouvelle vente</h1>
      <StepIndicator current={step} />

      {step === 1 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Choisir le client</h2>
          <p className="text-sm text-gray-500 mb-5">Sélectionnez un client existant ou créez-en un nouveau.</p>
          <div className="space-y-2 mb-4 max-h-[320px] overflow-y-auto">
            {(clients || []).map(client => (
              <button key={client.id} onClick={() => update('client_id', String(client.id))}
                className="w-full text-left p-4 rounded-lg border transition-all"
                style={{ borderColor: form.client_id === String(client.id) ? BLUE : '#E5E7EB', background: form.client_id === String(client.id) ? '#EFF6FF' : 'white' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: BLUE }}>
                    {initials(client.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-500">{client.phone} · {client.city}</p>
                  </div>
                  {form.client_id === String(client.id) && <Check size={16} style={{ color: BLUE }} />}
                </div>
              </button>
            ))}
            {clients.length === 0 && <p className="text-center text-gray-400 py-8">Aucun client. Créez-en un.</p>}
          </div>
          <button onClick={() => setShowNewClient(true)} className="btn btn-secondary w-full gap-2">
            <UserPlus size={15} /> Nouveau client
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Choisir l'article</h2>
          <p className="text-sm text-gray-500 mb-5">Sélectionnez l'article vendu.</p>
          <div className="space-y-2">
            {(articles || []).map(article => {
              const stock = article.stock ?? null
              const outOfStock = stock !== null && stock <= 0
              return (
                <button key={article.id} onClick={() => {
                  if (outOfStock) { toast.error(`"${article.name}" en rupture.`); return }
                  update('article_id', String(article.id))
                  update('total_amount', String(article.price))
                }}
                className={`w-full text-left p-4 rounded-lg border transition-all ${outOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ borderColor: form.article_id === String(article.id) ? BLUE : '#E5E7EB', background: form.article_id === String(article.id) ? '#EFF6FF' : 'white' }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{article.name}</p>
                      <p className="text-xs text-gray-500">
                        {article.category || 'Article'}
                        {stock !== null && <span className={`ml-2 ${outOfStock ? 'text-red-500 font-semibold' : 'text-green-600'}`}>· {outOfStock ? 'Rupture' : `${stock} en stock`}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="amount font-semibold text-gray-900">{formatAmount(article.price)}</span>
                      {form.article_id === String(article.id) && <Check size={16} style={{ color: BLUE }} />}
                    </div>
                  </div>
                </button>
              )
            })}
            {articles.length === 0 && <p className="text-center text-gray-400 py-8">Aucun article en stock.</p>}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Conditions de paiement</h2>
            <p className="text-sm text-gray-500">Choisissez le mode de paiement et les conditions.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Mode de paiement</label>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_MODES.map(({ value, label, desc }) => (
                <button key={value} type="button" onClick={() => update('payment_mode', value)}
                  className="text-left p-4 rounded-lg border transition-all"
                  style={{ borderColor: form.payment_mode === value ? BLUE : '#E5E7EB', background: form.payment_mode === value ? '#EFF6FF' : 'white' }}>
                  <p className="font-medium text-sm text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500 mt-1">{desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Montant total (FCFA) *</label>
            <input type="number" min={0} className="input amount" value={form.total_amount} onChange={e => update('total_amount', e.target.value)} placeholder="850000" />
          </div>
          {!isComptant && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Acompte initial (FCFA)</label>
                <input type="number" min={0} className="input amount" value={form.down_payment} onChange={e => update('down_payment', e.target.value)} placeholder="200000" />
                {downNum > 0 && totalNum > 0 && <p className="text-xs text-gray-500 mt-1.5">Reste : <span className="amount font-semibold text-gray-900">{formatAmount(remainingAfterDown)}</span></p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Nombre de tranches *</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => update('installment_count', Math.max(1, form.installment_count - 1))} className="btn btn-secondary w-10 h-10 p-0 text-lg font-bold">−</button>
                  <input type="number" min={1} max={60} className="input amount text-center w-20" value={form.installment_count} onChange={e => update('installment_count', Math.max(1, Number(e.target.value)))} />
                  <button type="button" onClick={() => update('installment_count', Math.min(60, form.installment_count + 1))} className="btn btn-secondary w-10 h-10 p-0 text-lg font-bold">+</button>
                  {installmentAmount > 0 && <span className="text-sm text-gray-500">→ <span className="amount font-semibold text-gray-900">{formatAmount(installmentAmount)}</span>/tranche</span>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Fréquence</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FREQUENCIES.map(({ value, label }) => (
                    <button key={value} type="button" onClick={() => update('frequency', value)}
                      className="py-2.5 rounded-lg border text-sm font-medium transition-all"
                      style={{ borderColor: form.frequency === value ? BLUE : '#E5E7EB', background: form.frequency === value ? '#EFF6FF' : 'white', color: form.frequency === value ? BLUE : '#374151' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {form.frequency === 'personnalise' && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Intervalle (jours) *</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Tous les</span>
                    <input type="number" min={1} max={365} className="input amount text-center w-20" value={form.custom_days} onChange={e => update('custom_days', Math.max(1, Number(e.target.value)))} />
                    <span className="text-sm text-gray-500">jours</span>
                  </div>
                </div>
              )}
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">{isComptant ? 'Date de vente' : 'Date de début'}</label>
            <input type="date" className="input" value={form.start_date} onChange={e => update('start_date', e.target.value)} />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Récapitulatif</h2>
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: isComptant ? '#F0FDF4' : '#EFF6FF', color: isComptant ? '#15803D' : BLUE, border: `1px solid ${isComptant ? '#BBF7D0' : '#DBEAFE'}` }}>
              {isComptant ? 'Paiement comptant' : 'Paiement par tranche'}
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { label: 'Client', value: selectedClient?.name },
              { label: 'Contact', value: selectedClient?.phone },
              { label: 'Article', value: selectedArticle?.name },
              { label: 'Montant total', value: formatAmount(totalNum), amount: true },
              ...(!isComptant ? [
                { label: 'Acompte', value: formatAmount(downNum), amount: true },
                { label: 'Reste à payer', value: formatAmount(remainingAfterDown), amount: true },
                { label: 'Nombre de tranches', value: `${form.installment_count} tranches` },
                { label: 'Montant / tranche', value: formatAmount(installmentAmount), amount: true },
                { label: 'Fréquence', value: form.frequency === 'personnalise' ? `Tous les ${form.custom_days} jours` : FREQUENCIES.find(f => f.value === form.frequency)?.label },
              ] : []),
              { label: isComptant ? 'Date de vente' : 'Date de début', value: form.start_date },
            ].map(({ label, value, amount: isAmount }) => (
              <div key={label} className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-500">{label}</span>
                <span className={`text-sm font-medium text-gray-900 ${isAmount ? 'amount' : ''}`}>{value || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/ventes')} className="btn btn-secondary gap-2">
          <ArrowLeft size={15} /> {step === 1 ? 'Annuler' : 'Précédent'}
        </button>
        {step < 4 ? (
          <button onClick={() => setStep(step + 1)} disabled={!canNext()} className="btn btn-primary gap-2">
            Suivant <ArrowRight size={15} />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading} className="btn btn-primary gap-2" style={{ background: SUCCESS, borderColor: SUCCESS }}>
            {loading ? <><Loader2 size={15} className="animate-spin" /> Création…</> : <><Check size={15} /> Créer la vente</>}
          </button>
        )}
      </div>

      <Modal open={showNewClient} onClose={() => setShowNewClient(false)} title="Nouveau client">
        <div className="space-y-4">
          {CLIENT_FORM_FIELDS.map(({ id, label, field, required, type, placeholder }) => (
            <div key={id}>
              <label htmlFor={id} className="block text-sm font-medium text-gray-900 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              <input id={id} type={type} className="input" value={clientForm[field]}
                onChange={e => setClientForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowNewClient(false)} className="btn btn-secondary flex-1">Annuler</button>
            <button onClick={handleSaveClient} disabled={savingClient} className="btn btn-primary flex-1 gap-2">
              {savingClient && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Créer et sélectionner
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
