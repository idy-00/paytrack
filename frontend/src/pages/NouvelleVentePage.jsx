import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Check, User, Package,
  CalendarDays, CreditCard, Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { MOCK_CLIENTS, MOCK_ARTICLES, formatAmount } from '@/lib/mockData'

const BLUE    = '#1A56DB'
const SUCCESS = '#16A34A'

const STEPS = [
  { id: 1, label: 'Client',        icon: User        },
  { id: 2, label: 'Article',       icon: Package     },
  { id: 3, label: 'Conditions',    icon: CalendarDays },
  { id: 4, label: 'Récapitulatif', icon: CreditCard  },
]

const FREQUENCIES = [
  { value: 'hebdomadaire', label: 'Hebdomadaire'        },
  { value: 'mensuel',      label: 'Mensuel'              },
  { value: 'bimestriel',   label: 'Toutes les 2 semaines' },
]

function initials(name = '') {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

/* ── StepIndicator ── */
function StepIndicator({ current }) {
  return (
    <nav aria-label="Étapes" className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const done   = step.id < current
        const active = step.id === current
        const Icon   = step.icon
        return (
          <div key={step.id} className="flex items-center">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: active ? BLUE : done ? '#DCFCE7' : 'transparent',
                color: active ? 'white' : done ? SUCCESS : '#9CA3AF',
              }}
            >
              {done ? <Check size={13} /> : <Icon size={13} />}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="w-8 h-px mx-1"
                style={{ background: step.id < current ? SUCCESS : '#E5E7EB' }}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}

/* ── NouvelleVentePage ── */
export default function NouvelleVentePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    client_id:         '',
    article_id:        '',
    total_amount:      '',
    down_payment:      '',
    installment_count: 3,
    frequency:         'mensuel',
    start_date:        new Date().toISOString().split('T')[0],
  })

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const selectedClient  = MOCK_CLIENTS.find(c => c.id === Number(form.client_id))
  const selectedArticle = MOCK_ARTICLES.find(a => a.id === Number(form.article_id))

  const totalNum           = Number(form.total_amount) || 0
  const downNum            = Number(form.down_payment) || 0
  const remainingAfterDown = totalNum - downNum
  const installmentAmount  = form.installment_count > 0
    ? Math.ceil(remainingAfterDown / form.installment_count)
    : 0

  const canNext = () => {
    if (step === 1) return !!form.client_id
    if (step === 2) return !!form.article_id
    if (step === 3) return totalNum > 0 && downNum >= 0 && downNum < totalNum && form.installment_count >= 1
    return true
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 800))
      toast.success('Vente créée avec succès !')
      navigate('/ventes')
    } catch {
      toast.error('Impossible de créer la vente. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-8">

      <button onClick={() => navigate('/ventes')} className="btn btn-ghost gap-2 mb-6 -ml-1">
        <ArrowLeft size={16} /> Retour aux ventes
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nouvelle vente par tranche</h1>

      <StepIndicator current={step} />

      {/* Étape 1 : Client */}
      {step === 1 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Choisir le client</h2>
          <p className="text-sm text-gray-500 mb-5">Sélectionnez un client existant.</p>
          <div className="space-y-2 mb-4">
            {MOCK_CLIENTS.map(client => (
              <button
                key={client.id}
                onClick={() => update('client_id', String(client.id))}
                className="w-full text-left p-4 rounded-lg border transition-all"
                style={{
                  borderColor: form.client_id === String(client.id) ? BLUE : '#E5E7EB',
                  background:  form.client_id === String(client.id) ? '#EFF6FF' : 'white',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: BLUE }}
                  >
                    {initials(client.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-500">{client.phone} · {client.city}</p>
                  </div>
                  {form.client_id === String(client.id) && (
                    <Check size={16} style={{ color: BLUE, flexShrink: 0 }} />
                  )}
                </div>
              </button>
            ))}
          </div>
          <button className="btn btn-secondary w-full gap-2">
            <User size={15} /> Nouveau client
          </button>
        </div>
      )}

      {/* Étape 2 : Article */}
      {step === 2 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Choisir l'article</h2>
          <p className="text-sm text-gray-500 mb-5">Sélectionnez l'article vendu.</p>
          <div className="space-y-2">
            {MOCK_ARTICLES.map(article => (
              <button
                key={article.id}
                onClick={() => {
                  update('article_id', String(article.id))
                  update('total_amount', String(article.price))
                }}
                className="w-full text-left p-4 rounded-lg border transition-all"
                style={{
                  borderColor: form.article_id === String(article.id) ? BLUE : '#E5E7EB',
                  background:  form.article_id === String(article.id) ? '#EFF6FF' : 'white',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{article.name}</p>
                    <p className="text-xs text-gray-500">{article.category}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="amount font-semibold text-gray-900">
                      {formatAmount(article.price)}
                    </span>
                    {form.article_id === String(article.id) && (
                      <Check size={16} style={{ color: BLUE }} />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Étape 3 : Conditions */}
      {step === 3 && (
        <div className="card p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Conditions de paiement</h2>
            <p className="text-sm text-gray-500">Définissez le montant total, l'acompte et l'échéancier.</p>
          </div>

          <div>
            <label htmlFor="total" className="block text-sm font-medium text-gray-900 mb-1.5">
              Montant total (FCFA) <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="total"
              type="number"
              min={0}
              className="input amount"
              value={form.total_amount}
              onChange={e => update('total_amount', e.target.value)}
              placeholder="850000"
            />
          </div>

          <div>
            <label htmlFor="down" className="block text-sm font-medium text-gray-900 mb-1.5">
              Acompte initial (FCFA)
            </label>
            <input
              id="down"
              type="number"
              min={0}
              max={totalNum > 0 ? totalNum - 1 : undefined}
              className="input amount"
              value={form.down_payment}
              onChange={e => update('down_payment', e.target.value)}
              placeholder="200000"
            />
            {downNum > 0 && totalNum > 0 && (
              <p className="text-xs text-gray-500 mt-1.5">
                Reste après acompte :&nbsp;
                <span className="amount font-semibold text-gray-900">{formatAmount(remainingAfterDown)}</span>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="count" className="block text-sm font-medium text-gray-900 mb-1.5">
              Nombre de tranches <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => update('installment_count', Math.max(1, form.installment_count - 1))}
                className="btn btn-secondary w-10 h-10 p-0 text-lg font-bold"
              >
                −
              </button>
              <input
                id="count"
                type="number"
                min={1}
                max={60}
                className="input amount text-center w-20"
                value={form.installment_count}
                onChange={e => update('installment_count', Math.max(1, Number(e.target.value)))}
              />
              <button
                type="button"
                onClick={() => update('installment_count', Math.min(60, form.installment_count + 1))}
                className="btn btn-secondary w-10 h-10 p-0 text-lg font-bold"
              >
                +
              </button>
              {installmentAmount > 0 && (
                <span className="text-sm text-gray-500">
                  → <span className="amount font-semibold text-gray-900">{formatAmount(installmentAmount)}</span>/tranche
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Fréquence</label>
            <div className="grid grid-cols-3 gap-2">
              {FREQUENCIES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update('frequency', value)}
                  className="py-2.5 rounded-lg border text-sm font-medium transition-all"
                  style={{
                    borderColor: form.frequency === value ? BLUE : '#E5E7EB',
                    background:  form.frequency === value ? '#EFF6FF' : 'white',
                    color:       form.frequency === value ? BLUE : '#374151',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="start" className="block text-sm font-medium text-gray-900 mb-1.5">
              Date de début
            </label>
            <input
              id="start"
              type="date"
              className="input"
              value={form.start_date}
              onChange={e => update('start_date', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Étape 4 : Récapitulatif */}
      {step === 4 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Récapitulatif</h2>
          <div className="divide-y divide-gray-100">
            {[
              { label: 'Client',            value: selectedClient?.name },
              { label: 'Contact',           value: selectedClient?.phone },
              { label: 'Article',           value: selectedArticle?.name },
              { label: 'Montant total',     value: formatAmount(totalNum),           amount: true },
              { label: 'Acompte',           value: formatAmount(downNum),            amount: true },
              { label: 'Reste à payer',     value: formatAmount(remainingAfterDown), amount: true },
              { label: 'Nombre de tranches', value: `${form.installment_count} tranches` },
              { label: 'Montant / tranche', value: formatAmount(installmentAmount),  amount: true },
              { label: 'Fréquence',         value: FREQUENCIES.find(f => f.value === form.frequency)?.label },
              { label: 'Date de début',     value: form.start_date },
            ].map(({ label, value, amount: isAmount }) => (
              <div key={label} className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-500">{label}</span>
                <span className={`text-sm font-medium text-gray-900 ${isAmount ? 'amount' : ''}`}>
                  {value || '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : navigate('/ventes')}
          className="btn btn-secondary gap-2"
        >
          <ArrowLeft size={15} />
          {step === 1 ? 'Annuler' : 'Précédent'}
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="btn btn-primary gap-2"
          >
            Suivant <ArrowRight size={15} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-primary gap-2"
            style={{ background: SUCCESS, borderColor: SUCCESS }}
          >
            {loading ? (
              <><Loader2 size={15} className="animate-spin" /> Création…</>
            ) : (
              <><Check size={15} /> Créer la vente</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
