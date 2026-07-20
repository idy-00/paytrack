import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, ArrowRight, QrCode, ShoppingBag } from 'lucide-react'
import { MOCK_SALES, formatAmount, formatDate, getProgressPercent } from '@/lib/mockData'
import StatusBadge from '@/components/ui/StatusBadge'
import ProgressBar from '@/components/ui/ProgressBar'

const BLUE = '#1A56DB'

const STATUS_FILTERS = [
  { value: 'tous',   label: 'Tous' },
  { value: 'actif',  label: 'Actif' },
  { value: 'retard', label: 'Retard' },
  { value: 'solde',  label: 'Soldé' },
  { value: 'litige', label: 'Litige' },
]

function initials(name = '') {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function VentesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('tous')

  const filtered = MOCK_SALES.filter(s => {
    const matchStatus = statusFilter === 'tous' || s.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      s.client.name.toLowerCase().includes(q) ||
      s.reference.toLowerCase().includes(q) ||
      s.article.name.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-8">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{MOCK_SALES.length} ventes au total</p>
        </div>
        <Link to="/ventes/nouvelle" className="btn btn-primary gap-2">
          <Plus size={16} /> Nouvelle vente
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Chercher par client, référence, article…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10"
            aria-label="Rechercher des ventes"
          />
        </div>
        <div className="flex gap-2 flex-wrap" role="group" aria-label="Filtrer par statut">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              aria-pressed={statusFilter === value}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                statusFilter === value
                  ? 'text-white border-transparent'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              style={statusFilter === value ? { background: '#0F2744', borderColor: '#0F2744' } : {}}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table desktop */}
      <div className="card hidden md:block overflow-x-auto">
        <table className="w-full" role="table" aria-label="Liste des ventes">
          <thead>
            <tr>
              {['Référence', 'Client', 'Article', 'Montant', 'Progression', 'Prochaine échéance', 'Statut', ''].map(h => (
                <th key={h} className="table-header text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(sale => {
              const pct = getProgressPercent(sale.paid_amount, sale.total_amount)
              const nextDue = sale.schedule.find(s => s.status !== 'paye')
              return (
                <tr key={sale.id} className="table-row">
                  <td className="table-cell">
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 border border-gray-200">
                      {sale.reference}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: BLUE }}
                      >
                        {initials(sale.client.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{sale.client.name}</p>
                        <p className="text-xs text-gray-500">{sale.client.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell max-w-[160px] truncate text-gray-600">
                    {sale.article.name}
                  </td>
                  <td className="table-cell">
                    <div className="amount font-semibold text-gray-900">{formatAmount(sale.total_amount)}</div>
                    <div className="amount text-xs text-gray-500">{formatAmount(sale.remaining_amount)} restant</div>
                  </td>
                  <td className="table-cell w-36">
                    <ProgressBar percent={pct} status={sale.status} showLabel />
                  </td>
                  <td className="table-cell text-gray-600">
                    {nextDue ? (
                      <span>
                        <span className="amount font-medium text-gray-900">{formatAmount(nextDue.amount)}</span>
                        <br />
                        <span className="text-xs text-gray-500">{formatDate(nextDue.due_date)}</span>
                      </span>
                    ) : '—'}
                  </td>
                  <td className="table-cell">
                    <StatusBadge status={sale.status} />
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <Link
                        to={`/qr/${sale.qr_uuid}`}
                        className="btn btn-ghost btn-icon btn-sm"
                        aria-label="QR Code"
                      >
                        <QrCode size={14} />
                      </Link>
                      <Link
                        to={`/ventes/${sale.id}`}
                        className="btn btn-ghost btn-icon btn-sm"
                        aria-label="Voir le dossier"
                      >
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <ShoppingBag size={36} className="text-gray-200" />
                    <p className="text-sm font-medium">Aucune vente ne correspond à votre recherche.</p>
                    <p className="text-xs">Essayez d'autres filtres ou créez une nouvelle vente.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="md:hidden space-y-3">
        {filtered.map(sale => {
          const pct = getProgressPercent(sale.paid_amount, sale.total_amount)
          return (
            <Link key={sale.id} to={`/ventes/${sale.id}`} className="card block p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{sale.client.name}</p>
                  <p className="font-mono text-xs text-gray-400">{sale.reference}</p>
                </div>
                <StatusBadge status={sale.status} size="sm" />
              </div>
              <p className="text-xs text-gray-500 mb-3 truncate">{sale.article.name}</p>
              <div className="flex justify-between mb-2">
                <span className="amount text-sm font-semibold text-gray-900">{formatAmount(sale.paid_amount)}</span>
                <span className="amount text-xs text-gray-400">/ {formatAmount(sale.total_amount)}</span>
              </div>
              <ProgressBar percent={pct} status={sale.status} showLabel />
            </Link>
          )
        })}
        {filtered.length === 0 && (
          <div className="card p-12 text-center">
            <ShoppingBag size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Aucune vente ne correspond à votre recherche.</p>
          </div>
        )}
      </div>

      {/* FAB mobile */}
      <Link
        to="/ventes/nouvelle"
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-2xl flex items-center justify-center text-white"
        style={{ background: BLUE, boxShadow: '0 4px 20px rgba(26,86,219,0.40)' }}
        aria-label="Nouvelle vente"
      >
        <Plus size={24} />
      </Link>
    </div>
  )
}
