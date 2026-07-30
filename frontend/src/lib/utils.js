export function formatAmount(amount) {
  return new Intl.NumberFormat('fr-SN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA'
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-SN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function getProgressPercent(paid, total) {
  if (!total) return 0
  return Math.round((paid / total) * 100)
}

export function getStatusConfig(status) {
  const configs = {
    actif:      { label: 'Actif',      className: 'badge-active',  dot: '#1D4ED8' },
    paye:       { label: 'Payé',       className: 'badge-paid',    dot: '#15803D' },
    en_cours:   { label: 'En cours',   className: 'badge-active',  dot: '#1D4ED8' },
    retard:     { label: 'Retard',     className: 'badge-late',    dot: '#C2410C' },
    litige:     { label: 'Litige',     className: 'badge-dispute', dot: '#BE123C' },
    solde:      { label: 'Soldé',      className: 'badge-settled', dot: '#475569' },
    en_attente: { label: 'En attente', className: 'badge-pending', dot: '#64748B' },
  }
  return configs[status] || configs['en_attente']
}
