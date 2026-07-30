import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, QrCode, CheckCircle2, Clock, AlertCircle, ArrowRight, PackageOpen, Loader2 } from 'lucide-react'
import { formatAmount, formatDate, getProgressPercent } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import StatusBadge from '@/components/ui/StatusBadge'
import ProgressBar from '@/components/ui/ProgressBar'

export default function ClientDashboard() {
  const { user } = useAuthStore()
  const [clientSales, setClientSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSales('?as_client=1').then(res => setClientSales(res.data || res || []))
      .catch(() => setClientSales([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (clientSales.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="w-16 h-16 bg-fog rounded-2xl flex items-center justify-center mx-auto mb-4">
          <PackageOpen size={28} className="text-muted" />
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">Aucun dossier trouvé</h2>
        <p className="text-dim text-sm max-w-xs mx-auto leading-relaxed">
          Aucune vente à crédit n'est associée à votre compte.
        </p>
      </div>
    )
  }

  const totalPaid = clientSales.reduce((acc, s) => acc + (s.paid_amount || 0), 0)
  const totalAmount = clientSales.reduce((acc, s) => acc + (s.total_amount || 0), 0)
  const totalDue = clientSales.reduce((acc, s) => acc + (s.remaining_amount || 0), 0)
  const overallPct = getProgressPercent(totalPaid, totalAmount)
  const mainSale = clientSales[0]
  const schedule = mainSale?.schedule || mainSale?.schedules || []
  const nextInstallment = schedule.find(s => s.status === 'retard' || s.status === 'en_attente')

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-2">
      <div>
        <p className="text-muted text-sm mb-0.5">Bonjour,</p>
        <h1 className="text-2xl font-bold text-ink">{user?.name}</h1>
      </div>

      <div className="rounded-2xl bg-white p-6 relative overflow-hidden"
        style={{ border: '1px solid #E8E4DD', borderTop: '3px solid #1D6FE8', boxShadow: '0 2px 12px rgba(29,111,232,0.08)' }}>
        <p className="text-sm mb-2" style={{ color: '#6B7280' }}>Total restant à payer</p>
        <div className="amount text-[40px] font-bold leading-none mb-1" style={{ color: '#1A1A1A' }}>
          {formatAmount(totalDue)}
        </div>
        <p className="text-sm font-mono mt-1.5" style={{ color: '#6B7280' }}>
          {formatAmount(totalPaid)} réglé sur {formatAmount(totalAmount)}
        </p>
        <div className="mt-5">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#EEF4FE' }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${overallPct}%`, background: '#1D6FE8' }} />
          </div>
          <p className="text-xs mt-1.5" style={{ color: '#6B7280' }}>{overallPct}% réglé</p>
        </div>
      </div>

      {nextInstallment && (
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${nextInstallment.status === 'retard' ? 'border-amber-200 bg-amber-50' : 'border-blue/30 bg-sky'}`}>
          {nextInstallment.status === 'retard' ? <AlertCircle size={20} className="text-warning flex-shrink-0 mt-0.5" /> : <Clock size={20} className="text-blue flex-shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${nextInstallment.status === 'retard' ? 'text-warning' : 'text-blue'}`}>
              {nextInstallment.status === 'retard' ? 'Paiement en retard' : 'Prochaine échéance'}
            </p>
            <p className="text-dim text-sm mt-0.5">
              <span className="amount font-semibold">{formatAmount(nextInstallment.amount)}</span> — Tranche n°{nextInstallment.num || 1}
            </p>
            <p className="text-muted text-xs mt-0.5">Prévue le {formatDate(nextInstallment.due_date)}</p>
          </div>
        </div>
      )}

      <section>
        <h2 className="text-base font-semibold text-ink mb-3">Mes dossiers</h2>
        <div className="space-y-3">
          {clientSales.map(sale => {
            const pct = getProgressPercent(sale.paid_amount, sale.total_amount)
            return (
              <Link key={sale.id} to={`/client/vente/${sale.id}`} className="card block p-5 hover:shadow-md transition-shadow duration-150">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="font-semibold text-ink">{sale.article?.name || '—'}</p>
                    <p className="text-xs text-muted font-mono mt-0.5 tracking-tight">{sale.reference}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={sale.status} size="sm" />
                    <ArrowRight size={14} className="text-muted" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: 'Total', value: formatAmount(sale.total_amount) },
                    { label: 'Payé', value: formatAmount(sale.paid_amount) },
                    { label: 'Restant', value: formatAmount(sale.remaining_amount) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-fog rounded-lg p-2.5 text-center">
                      <div className="amount text-sm font-semibold text-ink leading-snug">{value}</div>
                      <div className="text-[11px] text-muted mt-0.5 uppercase tracking-wide font-medium">{label}</div>
                    </div>
                  ))}
                </div>
                <ProgressBar percent={pct} status={sale.status} showLabel />
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-ash">
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <Calendar size={12} />
                    <span>{sale.installment_count || 0} tranches · {sale.frequency || '—'}</span>
                  </div>
                  {sale.qr_uuid && (
                    <Link to={`/qr/${sale.qr_uuid}`} onClick={e => e.stopPropagation()} className="btn btn-ghost btn-sm gap-1 px-2">
                      <QrCode size={13} /> QR
                    </Link>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {mainSale && schedule.length > 0 && (
        <section className="card p-5">
          <h2 className="text-base font-semibold text-ink mb-4">Échéancier — {mainSale.article?.name}</h2>
          <div className="space-y-2">
            {schedule.map((item, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${item.status === 'paye' ? 'bg-green-50' : item.status === 'retard' ? 'bg-amber-50' : 'bg-fog'}`}>
                <div className="flex-shrink-0">
                  {item.status === 'paye' ? <CheckCircle2 size={18} className="text-success" />
                    : item.status === 'retard' ? <AlertCircle size={18} className="text-warning" />
                    : <div className="w-[18px] h-[18px] rounded-full border-2 border-ash" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">Tranche {item.num || i + 1}</span>
                    <span className="amount text-sm font-semibold text-ink">{formatAmount(item.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-muted">Échéance : {formatDate(item.due_date)}</span>
                    {item.paid_date && <span className="text-xs text-success">Payé le {formatDate(item.paid_date)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
