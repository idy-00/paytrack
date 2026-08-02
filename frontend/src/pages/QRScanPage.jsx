import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Lock, CheckCircle2, AlertCircle, ArrowRight, Receipt, Loader2 } from 'lucide-react'
import { formatAmount, formatDate, getProgressPercent } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import Logo from '@/components/ui/Logo'
import StatusBadge from '@/components/ui/StatusBadge'
import ProgressBar from '@/components/ui/ProgressBar'

function maskName(fullName) {
  return (fullName || '').split(' ').map(part => part.length > 2 ? part[0] + '•'.repeat(part.length - 1) : part).join(' ')
}

export default function QRScanPage() {
  const { uuid } = useParams()
  const { isAuthenticated, user } = useAuthStore()
  const [sale, setSale] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getQrInfo(uuid).then(setSale).catch(() => setSale(null)).finally(() => setLoading(false))
  }, [uuid])

  if (loading) {
    return <div className="min-h-dvh bg-snow flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  if (!sale) {
    return (
      <div className="min-h-dvh bg-snow flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-fog rounded-2xl flex items-center justify-center mx-auto mb-4"><Receipt size={28} className="text-muted" /></div>
          <h1 className="text-xl font-bold text-ink mb-2">Dossier introuvable</h1>
          <p className="text-dim text-sm leading-relaxed">Ce QR code ne correspond à aucun dossier actif.</p>
          <Link to="/login" className="btn btn-secondary btn-sm mt-5">Accéder à PayTrack</Link>
        </div>
      </div>
    )
  }

  const pct = getProgressPercent(sale.paid_amount, sale.total_amount)
  const maskedClientName = sale.client_name || maskName(sale.client?.name)

  return (
    <div className="min-h-dvh bg-snow">
      <header className="bg-navy text-white px-5 py-3.5 flex items-center gap-3">
        <Logo size={28} />
        <span className="text-lg font-bold tracking-tight">PayTrack</span>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="card p-5 text-center">
          <p className="text-xs text-muted font-mono tracking-tight mb-1.5">{sale.reference}</p>
          <h1 className="text-xl font-bold text-ink mb-3">Dossier de paiement</h1>
          <StatusBadge status={sale.status} />
        </div>

        <div className="card p-5 space-y-3.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-dim">Client</span>
            <span className="font-semibold text-ink">{isAuthenticated ? (sale.client?.name || sale.client_name) : maskedClientName}</span>
          </div>
          {isAuthenticated && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-dim">Article</span>
              <span className="font-medium text-ink text-right max-w-[60%] truncate">{sale.article?.name || sale.article || '—'}</span>
            </div>
          )}
          <hr className="divider" />
          {isAuthenticated ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-dim">Montant total</span>
                <span className="amount font-semibold text-ink">{formatAmount(sale.total_amount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-dim">Déjà réglé</span>
                <span className="amount font-semibold text-success">{formatAmount(sale.paid_amount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-dim">Restant à payer</span>
                <span className="amount font-semibold text-blue">{formatAmount(sale.remaining_amount)}</span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted">Progression</span>
                  <span className="amount text-xs font-semibold text-dim">{pct}%</span>
                </div>
                <ProgressBar percent={pct} status={sale.status} />
              </div>
            </>
          ) : (
            <div className="py-4 text-center space-y-1.5">
              <div className="flex items-center justify-center gap-2 text-muted text-sm"><Lock size={15} /><span>Informations masquées</span></div>
              <p className="text-xs text-muted leading-relaxed">Connectez-vous pour voir les montants.</p>
            </div>
          )}
        </div>

        {isAuthenticated && (
          <div className="card p-5 flex flex-col items-center gap-3">
            <p className="text-xs text-muted uppercase tracking-widest font-semibold">QR Code</p>
            <div className="p-3 bg-white rounded-xl border border-ash shadow-xs">
              <QRCodeSVG value={`${window.location.origin}/qr/${sale.qr_uuid}`} size={140} level="M" includeMargin={false} />
            </div>
            <p className="text-[11px] text-muted font-mono">{sale.qr_uuid}</p>
          </div>
        )}

        {!isAuthenticated ? (
          <Link to="/login" className="btn btn-primary btn-lg w-full gap-2"><Lock size={18} />Se connecter pour accéder au dossier</Link>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
              <CheckCircle2 size={16} /><span>Connecté en tant que {user?.name}</span>
            </div>
            <Link to={`/ventes/${sale.id}`} className="btn btn-primary btn-lg w-full gap-2">Voir le dossier complet <ArrowRight size={17} /></Link>
          </div>
        )}

        <p className="text-[11px] text-muted text-center pb-2">PayTrack · {formatDate(new Date().toISOString())}</p>
      </div>
    </div>
  )
}
