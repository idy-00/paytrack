import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, QrCode, Download, Plus, CheckCircle2,
  AlertCircle, Clock, Phone, Mail, MapPin,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { MOCK_SALES, formatAmount, formatDate, getProgressPercent } from '@/lib/mockData'
import StatusBadge from '@/components/ui/StatusBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import Modal from '@/components/ui/Modal'

const BLUE    = '#1A56DB'
const NAVY    = '#0F2744'
const SUCCESS = '#16A34A'
const WARNING = '#D97706'
const DANGER  = '#DC2626'

const PAYMENT_METHODS = [
  { value: 'wave',         label: 'Wave'         },
  { value: 'orange_money', label: 'Orange Money'  },
  { value: 'especes',      label: 'Espèces'       },
]

function initials(name = '') {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function VenteDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [showQR, setShowQR] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('wave')
  const [paying, setPaying] = useState(false)

  const sale = MOCK_SALES.find(s => s.id === Number(id))

  if (!sale) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">Vente introuvable.</p>
        <button onClick={() => navigate('/ventes')} className="btn btn-secondary">Retour</button>
      </div>
    )
  }

  const pct      = getProgressPercent(sale.paid_amount, sale.total_amount)
  const qrUrl    = `${window.location.origin}/qr/${sale.qr_uuid}`
  const nextDue  = sale.schedule.find(s => s.status !== 'paye')
  const amtNum   = Number(payAmount) || 0
  const afterPay = Math.max(0, sale.remaining_amount - amtNum)

  const handlePay = async () => {
    if (!payAmount || amtNum <= 0) {
      toast.error('Veuillez saisir un montant valide.')
      return
    }
    if (amtNum > sale.remaining_amount) {
      toast.error(`Le montant ne peut pas dépasser le restant dû (${formatAmount(sale.remaining_amount)}).`)
      return
    }
    setPaying(true)
    await new Promise(r => setTimeout(r, 800))
    setPaying(false)
    setShowPayModal(false)
    setPayAmount('')
    toast.success(`Paiement de ${formatAmount(amtNum)} enregistré !`)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-8">

      {/* Header nav */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={() => navigate('/ventes')} className="btn btn-ghost gap-2 -ml-1">
          <ArrowLeft size={16} /> Retour
        </button>
        <div className="flex gap-2">
          <button onClick={() => setShowQR(true)} className="btn btn-secondary gap-2">
            <QrCode size={15} /> QR Code
          </button>
          <button
            onClick={() => setShowPayModal(true)}
            className="btn btn-primary gap-2"
            disabled={sale.status === 'solde'}
          >
            <Plus size={15} /> Enregistrer un paiement
          </button>
        </div>
      </div>

      {/* Header card */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                {sale.reference}
              </span>
              <StatusBadge status={sale.status} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{sale.article.name}</h1>
          </div>
          <button
            onClick={() => setShowQR(true)}
            className="btn btn-ghost btn-sm gap-2 text-gray-500"
          >
            <QrCode size={14} /> QR
          </button>
        </div>

        {/* Alerte */}
        {nextDue && sale.status !== 'solde' && (
          <div
            className="flex items-center gap-3 p-3 rounded-lg mb-4"
            style={{
              background: nextDue.status === 'retard' ? '#FFF7ED' : '#EFF6FF',
              border: `1px solid ${nextDue.status === 'retard' ? `${WARNING}40` : `${BLUE}30`}`,
            }}
          >
            {nextDue.status === 'retard'
              ? <AlertCircle size={16} style={{ color: WARNING, flexShrink: 0 }} />
              : <Clock size={16} style={{ color: BLUE, flexShrink: 0 }} />
            }
            <p className="text-sm">
              <span className="font-semibold" style={{ color: nextDue.status === 'retard' ? WARNING : BLUE }}>
                {nextDue.status === 'retard' ? 'Retard de paiement' : 'Prochaine échéance'}
              </span>
              <span className="text-gray-600 ml-2">
                {formatAmount(nextDue.amount)} — {formatDate(nextDue.due_date)}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Hero card navy */}
      <div className="card overflow-hidden" style={{ background: NAVY, borderColor: '#1E3A5F' }}>
        <div className="p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-blue-300 text-xs font-medium uppercase tracking-wider mb-1">
                Montant total
              </p>
              <p className="amount text-3xl font-bold text-white">
                {formatAmount(sale.total_amount)}
              </p>
            </div>
            <span className="text-blue-400 text-sm font-medium">{pct}%</span>
          </div>

          <ProgressBar percent={pct} status={sale.status} />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              { label: 'Payé',    value: formatAmount(sale.paid_amount),     highlight: true },
              { label: 'Restant', value: formatAmount(sale.remaining_amount) },
              { label: 'Acompte', value: formatAmount(sale.down_payment)     },
              { label: 'Tranches', value: `${sale.installment_count} × ${formatAmount(sale.installment_amount)}` },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="bg-white/08 rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <p className="amount text-sm font-bold" style={{ color: highlight ? '#60A5FA' : 'white' }}>
                  {value}
                </p>
                <p className="text-blue-300 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-5">

        {/* Échéancier */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Échéancier</h2>
          <div className="space-y-2">
            {sale.schedule.map(item => (
              <div
                key={item.num}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{
                  background:
                    item.status === 'paye'   ? '#F0FDF4' :
                    item.status === 'retard' ? '#FFFBEB' : '#F9FAFB',
                }}
              >
                <div className="flex-shrink-0">
                  {item.status === 'paye' ? (
                    <CheckCircle2 size={18} style={{ color: SUCCESS }} />
                  ) : item.status === 'retard' ? (
                    <AlertCircle size={18} style={{ color: WARNING }} />
                  ) : (
                    <Clock size={18} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1 grid grid-cols-3 gap-2 items-center">
                  <span className="text-sm font-medium text-gray-900">Tranche {item.num}</span>
                  <span className="text-xs text-gray-500">{formatDate(item.due_date)}</span>
                  <span className="amount text-sm font-semibold text-gray-900 text-right">
                    {formatAmount(item.amount)}
                  </span>
                </div>
                <StatusBadge status={item.status} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Client */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Client</h2>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: BLUE }}
              >
                {initials(sale.client.name)}
              </div>
              <p className="font-medium text-gray-900">{sale.client.name}</p>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-gray-400 flex-shrink-0" />
                {sale.client.phone}
              </div>
              {sale.client.email && (
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-gray-400 flex-shrink-0" />
                  {sale.client.email}
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-gray-400 flex-shrink-0" />
                {sale.client.city}
              </div>
            </div>
          </div>

          {/* Historique paiements */}
          {sale.payments.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Paiements reçus</h2>
              <div className="space-y-0 divide-y divide-gray-100">
                {sale.payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatDate(p.date)}</p>
                      <p className="text-xs text-gray-400">
                        {p.type === 'acompte' ? 'Acompte' : 'Tranche'} · {p.receipt_no}
                      </p>
                    </div>
                    <span className="amount text-sm font-semibold" style={{ color: SUCCESS }}>
                      {formatAmount(p.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal QR Code */}
      <Modal open={showQR} onClose={() => setShowQR(false)} title="QR Code du dossier" size="sm">
        <div className="flex flex-col items-center text-center gap-5">
          <div className="p-4 bg-white border-2 border-gray-200 rounded-xl">
            <QRCodeSVG
              value={qrUrl}
              size={200}
              bgColor="#FFFFFF"
              fgColor="#111827"
              level="H"
              includeMargin={false}
            />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{sale.reference}</p>
            <p className="text-sm text-gray-500 mt-0.5">{sale.client.name}</p>
          </div>
          <p className="text-xs text-gray-400">
            Scannez pour accéder au dossier. Les informations complètes nécessitent une connexion.
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => { navigator.clipboard.writeText(qrUrl); toast.success('Lien copié !') }}
              className="btn btn-secondary flex-1"
            >
              Copier le lien
            </button>
            <button className="btn btn-primary flex-1 gap-2">
              <Download size={14} /> Télécharger
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Paiement */}
      <Modal open={showPayModal} onClose={() => setShowPayModal(false)} title="Enregistrer un paiement">
        <div className="space-y-5">
          {nextDue && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                Prochaine tranche attendue :&nbsp;
                <span className="amount font-bold">{formatAmount(nextDue.amount)}</span>
              </p>
            </div>
          )}

          <div>
            <label htmlFor="pay-amount" className="block text-sm font-medium text-gray-900 mb-1.5">
              Montant reçu (FCFA) <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="pay-amount"
              type="number"
              min={1}
              max={sale.remaining_amount}
              className="input amount"
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              placeholder={nextDue ? String(nextDue.amount) : '100000'}
            />
            {amtNum > 0 && (
              <p className="text-xs text-gray-500 mt-1.5">
                Reste après ce paiement :&nbsp;
                <span className="amount font-semibold text-gray-900">{formatAmount(afterPay)}</span>
              </p>
            )}
            {amtNum > sale.remaining_amount && (
              <p className="text-xs text-red-500 mt-1.5">
                Dépasse le restant dû ({formatAmount(sale.remaining_amount)})
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Mode de paiement
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPayMethod(value)}
                  className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    payMethod === value
                      ? 'text-white border-transparent'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                  style={payMethod === value ? { background: BLUE, borderColor: BLUE } : {}}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowPayModal(false)} className="btn btn-secondary flex-1">
              Annuler
            </button>
            <button
              onClick={handlePay}
              disabled={paying || amtNum <= 0 || amtNum > sale.remaining_amount}
              className="btn btn-primary flex-1 gap-2"
            >
              {paying
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <CheckCircle2 size={16} />
              }
              Confirmer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
