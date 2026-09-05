import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, QrCode, CheckCircle2, Clock, AlertCircle, ArrowRight, PackageOpen, Loader2, WalletCards } from 'lucide-react'
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
    <div className="max-w-[1180px] mx-auto space-y-6 py-1">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="pt-eyebrow mb-1">Espace client</p>
          <h1 className="page-heading text-3xl">Bonjour, {user?.name?.split(' ')[0] || 'client'}</h1>
          <p className="text-sm text-muted mt-1">Voici l’état de vos paiements et de vos dossiers.</p>
        </div>
        <div className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full bg-white border border-ash px-3 py-2 text-xs text-muted shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green" />
          Compte actif
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-3">
        <section className="xl:col-span-2 relative overflow-hidden rounded-[22px] p-6 sm:p-8 text-white"
          style={{ background: '#10243E', boxShadow: '0 20px 42px rgba(16,36,62,.18)' }}>
          <div className="absolute -right-16 -top-24 w-72 h-72 rounded-full border border-white/10" />
          <div className="absolute right-16 bottom-[-10rem] w-80 h-80 rounded-full bg-green/30 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-green-100">
              <WalletCards size={15} /> À régulariser
            </div>
            <p className="amount mt-4 text-[clamp(2.4rem,5vw,4.25rem)] font-bold tracking-tight leading-none">{formatAmount(totalDue)}</p>
            <p className="mt-3 text-sm text-slate-300">sur un total de {formatAmount(totalAmount)}</p>
            <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/15 pt-5 sm:max-w-md">
              <div>
                <p className="text-xs text-slate-400">Déjà réglé</p>
                <p className="amount mt-1 text-lg font-semibold">{formatAmount(totalPaid)}</p>
              </div>
              <div className="border-l border-white/15 pl-4">
                <p className="text-xs text-slate-400">Progression</p>
                <p className="amount mt-1 text-lg font-semibold">{overallPct}%</p>
              </div>
            </div>
            <div className="mt-5 max-w-xl h-2 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full rounded-full bg-green transition-all duration-700" style={{ width: `${overallPct}%` }} />
            </div>
          </div>
        </section>

        {nextInstallment && (
          <section className={`rounded-[22px] border p-6 flex flex-col justify-between ${nextInstallment.status === 'retard' ? 'border-amber-200 bg-amber-50' : 'border-blue/25 bg-white shadow-sm'}`}>
            <div>
              <div className={`inline-flex w-10 h-10 rounded-xl items-center justify-center ${nextInstallment.status === 'retard' ? 'bg-amber-100 text-warning' : 'bg-blue/10 text-blue'}`}>
                {nextInstallment.status === 'retard' ? <AlertCircle size={21} /> : <Clock size={21} />}
              </div>
              <p className={`mt-5 text-sm font-bold ${nextInstallment.status === 'retard' ? 'text-warning' : 'text-blue'}`}>
                {nextInstallment.status === 'retard' ? 'Paiement en retard' : 'Prochaine échéance'}
              </p>
              <p className="amount mt-2 text-2xl font-bold text-ink">{formatAmount(nextInstallment.amount)}</p>
              <p className="mt-1 text-sm text-dim">Tranche n°{nextInstallment.num || 1}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-ash flex items-center justify-between text-xs text-muted">
              <span>Prévue le {formatDate(nextInstallment.due_date)}</span>
              <Calendar size={15} />
            </div>
          </section>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="pt-eyebrow">Vos achats</p>
              <h2 className="text-xl font-bold text-ink">Mes dossiers</h2>
            </div>
            <span className="text-sm text-muted">{clientSales.length} dossier{clientSales.length > 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-3">
          {clientSales.map(sale => {
            const pct = getProgressPercent(sale.paid_amount, sale.total_amount)
            return (
              <Link key={sale.id} to={`/client/vente/${sale.id}`} className="card block p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-150">
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
        <section className="card p-5 xl:sticky xl:top-6 self-start">
          <p className="pt-eyebrow mb-1">À venir</p>
          <h2 className="text-lg font-bold text-ink mb-4">Échéancier</h2>
          <p className="text-sm text-muted -mt-3 mb-4 truncate">{mainSale.article?.name}</p>
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
    </div>
  )
}
