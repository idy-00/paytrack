const MAP = {
  actif:      { label: 'Actif',      cls: 'badge-active'  },
  paye:       { label: 'Payé',       cls: 'badge-paid'    },
  retard:     { label: 'Retard',     cls: 'badge-late'    },
  litige:     { label: 'Litige',     cls: 'badge-dispute' },
  solde:      { label: 'Soldé',      cls: 'badge-settled' },
  en_attente: { label: 'En attente', cls: 'badge-pending' },
}

export default function StatusBadge({ status, size = 'default' }) {
  const { label, cls } = MAP[status] ?? MAP.en_attente
  return (
    <span className={`badge ${cls} ${size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : ''}`}>
      <span className="badge-dot" aria-hidden="true" />
      {label}
    </span>
  )
}
