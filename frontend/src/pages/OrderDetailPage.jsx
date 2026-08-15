import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, CheckCircle, Package, Truck, XCircle, CreditCard, QrCode, Loader2, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { formatAmount } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']
const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'gray', icon: Clock },
  confirmed: { label: 'Confirmée', color: 'blue', icon: CheckCircle },
  preparing: { label: 'En préparation', color: 'amber', icon: Package },
  ready: { label: 'Prête', color: 'purple', icon: Package },
  delivered: { label: 'Livrée', color: 'green', icon: Truck },
  cancelled: { label: 'Annulée', color: 'red', icon: XCircle },
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'especes', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadOrder()
  }, [id])

  const loadOrder = async () => {
    try {
      const res = await api.getOrder(id)
      setOrder(res)
      setPaymentForm(f => ({ ...f, amount: res.remaining_amount || '' }))
    } catch (err) {
      toast.error('Commande non trouvée')
      navigate('/commandes')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      await api.updateOrderStatus(id, newStatus)
      toast.success('Statut mis à jour')
      loadOrder()
    } catch (err) {
      toast.error(err.message || 'Erreur')
    }
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.recordOrderPayment(id, {
        amount: parseInt(paymentForm.amount),
        payment_method: paymentForm.method,
        notes: paymentForm.notes,
      })
      toast.success('Paiement enregistré')
      setShowPaymentModal(false)
      loadOrder()
    } catch (err) {
      toast.error(err.message || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOnlinePayment = async () => {
    try {
      const res = await api.initiateOrderPayment(id, order.remaining_amount)
      if (res.payment_url) {
        window.location.href = res.payment_url
      } else {
        toast.error('Paiement en ligne non disponible')
      }
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

  if (!order) return null

  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const StatusIcon = status.icon
  const currentStep = STATUS_FLOW.indexOf(order.status)
  const progress = order.total_amount > 0 ? Math.round(((order.total_amount - order.remaining_amount) / order.total_amount) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/commandes')} className="btn btn-ghost btn-icon">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Commande {order.reference}</h1>
          <p className="text-sm text-gray-500">Créée le {new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
        </div>
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-${status.color}-100 text-${status.color}-700`}>
          <StatusIcon size={16} />
          {status.label}
        </span>
      </div>

      {/* Progress bar */}
      {order.status !== 'cancelled' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            {STATUS_FLOW.map((s, i) => {
              const conf = STATUS_CONFIG[s]
              const Icon = conf.icon
              const isActive = i <= currentStep
              const isCurrent = i === currentStep

              return (
                <div key={s} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? `bg-${conf.color}-500 text-white` : 'bg-gray-100 text-gray-400'} ${isCurrent ? 'ring-4 ring-' + conf.color + '-100' : ''}`}>
                    <Icon size={18} />
                  </div>
                  <span className={`text-xs mt-2 ${isActive ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{conf.label}</span>
                </div>
              )
            })}
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${(currentStep / (STATUS_FLOW.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-5">
        {/* Client info */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Client</h3>
          <p className="font-medium">{order.client?.full_name}</p>
          <p className="text-sm text-gray-500">{order.client?.phone}</p>
          {order.client?.email && <p className="text-sm text-gray-500">{order.client.email}</p>}
        </div>

        {/* Payment info */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Paiement</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <span className="font-bold">{formatAmount(order.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payé</span>
              <span className="font-medium text-green-600">{formatAmount(order.total_amount - order.remaining_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Reste</span>
              <span className="font-medium text-red-600">{formatAmount(order.remaining_amount)}</span>
            </div>
          </div>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-500 text-center mt-1">{progress}% payé</p>
        </div>

        {/* QR Code */}
        <div className="card p-5 flex flex-col items-center justify-center">
          <QrCode size={64} className="text-gray-300 mb-2" />
          <p className="text-xs text-gray-500">QR Code commande</p>
          {order.qr_uuid && (
            <p className="text-xs font-mono text-gray-400 mt-1">{order.qr_uuid.slice(0, 8)}...</p>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="card">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Articles ({order.items?.length || 0})</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header text-left">Article</th>
              <th className="table-header text-center">Qté</th>
              <th className="table-header text-right">Prix unit.</th>
              <th className="table-header text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map(item => (
              <tr key={item.id} className="table-row">
                <td className="table-cell font-medium">{item.article_name || item.article?.name}</td>
                <td className="table-cell text-center">{item.quantity}</td>
                <td className="table-cell text-right">{formatAmount(item.unit_price)}</td>
                <td className="table-cell text-right font-medium">{formatAmount(item.total_price)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50">
              <td colSpan={3} className="table-cell text-right font-semibold">Total</td>
              <td className="table-cell text-right font-bold text-lg">{formatAmount(order.total_amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Payments history */}
      {order.payments?.length > 0 && (
        <div className="card">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Paiements reçus</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {order.payments.map(p => (
              <div key={p.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{formatAmount(p.amount)}</p>
                  <p className="text-xs text-gray-500">{p.payment_method} - {new Date(p.payment_date).toLocaleDateString('fr-FR')}</p>
                </div>
                <span className="text-xs font-mono text-gray-400">{p.receipt_number}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {order.remaining_amount > 0 && (
          <>
            <button onClick={() => setShowPaymentModal(true)} className="btn btn-primary flex items-center gap-2">
              <Plus size={16} />
              Enregistrer un paiement
            </button>
            <button onClick={handleOnlinePayment} className="btn btn-secondary flex items-center gap-2">
              <CreditCard size={16} />
              Paiement en ligne
            </button>
          </>
        )}

        {order.status === 'pending' && (
          <>
            <button onClick={() => handleStatusChange('confirmed')} className="btn btn-primary">
              Confirmer la commande
            </button>
            <button onClick={() => handleStatusChange('cancelled')} className="btn btn-ghost text-red-600">
              Annuler
            </button>
          </>
        )}
        {order.status === 'confirmed' && (
          <button onClick={() => handleStatusChange('preparing')} className="btn btn-secondary">
            Démarrer préparation
          </button>
        )}
        {order.status === 'preparing' && (
          <button onClick={() => handleStatusChange('ready')} className="btn btn-secondary">
            Marquer comme prête
          </button>
        )}
        {order.status === 'ready' && (
          <button onClick={() => handleStatusChange('delivered')} className="btn btn-primary">
            Confirmer livraison
          </button>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Enregistrer un paiement</h2>
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
                <input
                  type="number"
                  className="input"
                  max={order.remaining_amount}
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Reste à payer: {formatAmount(order.remaining_amount)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
                <select
                  className="input"
                  value={paymentForm.method}
                  onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
                >
                  <option value="especes">Espèces</option>
                  <option value="wave">Wave</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="free_money">Free Money</option>
                  <option value="card">Carte bancaire</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
                <input
                  type="text"
                  className="input"
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
