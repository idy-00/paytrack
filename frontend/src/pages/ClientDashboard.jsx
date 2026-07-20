import { Link } from 'react-router-dom'
import { Calendar, QrCode, CheckCircle2, Clock, AlertCircle, ArrowRight, PackageOpen } from 'lucide-react'
import { MOCK_SALES, formatAmount, formatDate, getProgressPercent } from '@/lib/mockData'
import { useAuthStore } from '@/store/authStore'
import StatusBadge from '@/components/ui/StatusBadge'
import ProgressBar from '@/components/ui/ProgressBar'

export default function ClientDashboard() {
  const { user } = useAuthStore()

  // Isolation client : filtre dynamique par email du user connecté
  // En production, l'API filtre côté serveur par user_id
  const clientSales = MOCK_SALES.filter(s => {
    if (!user?.email) return false
    return s.client.email === user.email
  })

  // ── État vide ───────────────────────────────────────────────────────
  if (clientSales.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="w-16 h-16 bg-fog rounded-2xl flex items-center justify-center mx-auto mb-4">
          <PackageOpen size={28} className="text-muted" />
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">Aucun dossier trouvé</h2>
        <p className="text-dim text-sm max-w-xs mx-auto leading-relaxed">
          Aucune vente à crédit n'est associée à votre compte.
          Contactez votre vendeur pour plus d'informations.
        </p>
      </div>
    )
  }

  // ── Agrégats ────────────────────────────────────────────────────────
  const totalPaid   = clientSales.reduce((acc, s) => acc + s.paid_amount, 0)
  const totalAmount = clientSales.reduce((acc, s) => acc + s.total_amount, 0)
  const totalDue    = clientSales.reduce((acc, s) => acc + s.remaining_amount, 0)
  const overallPct  = getProgressPercent(totalPaid, totalAmount)
  const mainSale    = clientSales[0]
  const nextInstallment = mainSale?.schedule.find(
    s => s.status === 'retard' || s.status === 'en_attente'
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-2">

      {/* Greeting ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-muted text-sm mb-0.5">Bonjour,</p>
        <h1 className="text-2xl font-bold text-ink">{user?.name}</h1>
      </div>

      {/* Hero card — fond navy ──────────────────────────────────────── */}
      <div className="rounded-2xl bg-navy text-white p-6 relative overflow-hidden">
        {/* Decorative blobs */}
        <div
          className="absolute top-0 right-0 w-52 h-52 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none"
          style={{ background: 'rgba(26,86,219,0.22)' }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-0 w-36 h-36 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.05)' }}
          aria-hidden="true"
        />

        <div className="relative z-10">
          <p className="text-white/60 text-sm mb-2">Total restant à payer</p>

          {/* Montant hero — JetBrains Mono via .amount */}
          <div className="amount text-[40px] font-bold leading-none text-white mb-1">
            {formatAmount(totalDue)}
          </div>

          <p className="text-sm font-mono text-white/50 mt-1.5">
            {formatAmount(totalPaid)} réglé sur {formatAmount(totalAmount)}
          </p>

          {/* Progress bar blanc / transparent */}
          <div className="mt-5">
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.15)' }}
              role="progressbar"
              aria-valuenow={overallPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${overallPct}%`, background: 'rgba(255,255,255,0.85)' }}
              />
            </div>
            <p className="text-white/40 text-xs mt-1.5">{overallPct}% réglé</p>
          </div>
        </div>
      </div>

      {/* Alerte prochaine échéance ──────────────────────────────────── */}
      {nextInstallment && (
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${
          nextInstallment.status === 'retard'
            ? 'border-amber-200 bg-amber-50'
            : 'border-blue/30 bg-sky'
        }`}>
          {nextInstallment.status === 'retard' ? (
            <AlertCircle size={20} className="text-warning flex-shrink-0 mt-0.5" />
          ) : (
            <Clock size={20} className="text-blue flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${
              nextInstallment.status === 'retard' ? 'text-warning' : 'text-blue'
            }`}>
              {nextInstallment.status === 'retard' ? 'Paiement en retard' : 'Prochaine échéance'}
            </p>
            <p className="text-dim text-sm mt-0.5">
              <span className="amount font-semibold">{formatAmount(nextInstallment.amount)}</span>
              {' '}— Tranche n°{nextInstallment.num}
            </p>
            <p className="text-muted text-xs mt-0.5">
              Prévue le {formatDate(nextInstallment.due_date)}
            </p>
          </div>
        </div>
      )}

      {/* Liste des dossiers ─────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-ink mb-3">Mes dossiers</h2>
        <div className="space-y-3">
          {clientSales.map(sale => {
            const pct = getProgressPercent(sale.paid_amount, sale.total_amount)
            return (
              <Link
                key={sale.id}
                to={`/client/vente/${sale.id}`}
                className="card block p-5 hover:shadow-md transition-shadow duration-150"
              >
                {/* Titre + badge statut */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="font-semibold text-ink">{sale.article.name}</p>
                    <p className="text-xs text-muted font-mono mt-0.5 tracking-tight">
                      {sale.reference}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={sale.status} size="sm" />
                    <ArrowRight size={14} className="text-muted" />
                  </div>
                </div>

                {/* Grid 3 stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: 'Total',   value: formatAmount(sale.total_amount) },
                    { label: 'Payé',    value: formatAmount(sale.paid_amount) },
                    { label: 'Restant', value: formatAmount(sale.remaining_amount) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-fog rounded-lg p-2.5 text-center">
                      <div className="amount text-sm font-semibold text-ink leading-snug">
                        {value}
                      </div>
                      <div className="text-[11px] text-muted mt-0.5 uppercase tracking-wide font-medium">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Barre de progression + % */}
                <ProgressBar percent={pct} status={sale.status} showLabel />

                {/* Footer — fréquence + bouton QR */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-ash">
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <Calendar size={12} />
                    <span>{sale.installment_count} tranches · {sale.frequency}</span>
                  </div>
                  <Link
                    to={`/qr/${sale.qr_uuid}`}
                    onClick={e => e.stopPropagation()}
                    className="btn btn-ghost btn-sm gap-1 px-2"
                    aria-label="Voir le QR Code"
                  >
                    <QrCode size={13} />
                    QR
                  </Link>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Échéancier du dossier principal ───────────────────────────── */}
      {mainSale && (
        <section className="card p-5">
          <h2 className="text-base font-semibold text-ink mb-4">
            Échéancier — {mainSale.article.name}
          </h2>
          <div className="space-y-2">
            {mainSale.schedule.map(item => (
              <div
                key={item.num}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  item.status === 'paye'   ? 'bg-green-50' :
                  item.status === 'retard' ? 'bg-amber-50' : 'bg-fog'
                }`}
              >
                {/* Icône statut */}
                <div className="flex-shrink-0">
                  {item.status === 'paye' ? (
                    <CheckCircle2 size={18} className="text-success" />
                  ) : item.status === 'retard' ? (
                    <AlertCircle size={18} className="text-warning" />
                  ) : (
                    <div className="w-[18px] h-[18px] rounded-full border-2 border-ash" />
                  )}
                </div>

                {/* Détail */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">Tranche {item.num}</span>
                    <span className="amount text-sm font-semibold text-ink">
                      {formatAmount(item.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-muted">
                      Échéance : {formatDate(item.due_date)}
                    </span>
                    {item.paid_date && (
                      <span className="text-xs text-success">
                        Payé le {formatDate(item.paid_date)}
                      </span>
                    )}
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
