const COLORS = {
  actif:      '#1A56DB',
  solde:      '#16A34A',
  paye:       '#16A34A',
  retard:     '#D97706',
  litige:     '#DC2626',
  en_attente: '#9CA3AF',
}

export default function ProgressBar({ percent, status = 'actif', showLabel = false }) {
  const color = COLORS[status] ?? COLORS.actif
  const clamped = Math.min(100, Math.max(0, percent))
  return (
    <div className="flex items-center gap-2">
      <div className="progress-track flex-1"
        role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-fill" style={{ width: `${clamped}%`, background: color }} />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-muted amount tabular-nums w-8 text-right">
          {clamped}%
        </span>
      )}
    </div>
  )
}
