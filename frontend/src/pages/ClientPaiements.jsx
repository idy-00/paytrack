import { useState, useEffect } from 'react'
import { CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { formatAmount, formatDate } from '@/lib/utils'
import { api } from '@/lib/api'

export default function ClientPaiements() {
  const [allPayments, setAllPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSales('?as_client=1').then(res => {
      const sales = res.data || res || []
      const payments = sales.flatMap(s => (s.payments || []).map(p => ({ ...p, sale: s })))
        .sort((a, b) => new Date(b.payment_date || b.date) - new Date(a.payment_date || a.date))
      setAllPayments(payments)
    }).catch(() => setAllPayments([])).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  if (allPayments.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <Clock size={36} className="mx-auto text-gray-200 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun paiement</h2>
        <p className="text-sm text-gray-500">Vos paiements apparaîtront ici une fois enregistrés.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-2">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes paiements</h1>
        <p className="text-sm text-gray-500 mt-0.5">{allPayments.length} paiement{allPayments.length > 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-3">
        {allPayments.map((payment, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                <span className="amount font-semibold text-gray-900">{formatAmount(payment.amount)}</span>
              </div>
              <span className="text-xs text-gray-500">{formatDate(payment.payment_date || payment.date)}</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">{payment.sale?.article?.name || '—'}</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{payment.type || payment.payment_method || 'Paiement'}</span>
            </div>
            {payment.receipt_no && <p className="text-xs text-gray-400 mt-1 font-mono">{payment.receipt_no}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
