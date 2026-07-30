import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Download, Wallet, Calendar, Receipt, TrendingUp, CreditCard, Loader2 } from 'lucide-react'
import { formatAmount, formatDate } from '@/lib/utils'
import { api } from '@/lib/api'

const BLUE = '#1A56DB'
const NAVY = '#0F2744'
const SUCCESS = '#16A34A'

const METHOD_LABELS = { especes: 'Espèces', wave: 'Wave', orange_money: 'Orange Money', free_money: 'Free Money', virement: 'Virement', cheque: 'Chèque' }
const METHOD_STYLES = {
  wave: { bg: 'rgba(0,133,199,0.10)', color: '#0085C7' },
  orange_money: { bg: 'rgba(255,101,0,0.10)', color: '#E55C00' },
  free_money: { bg: 'rgba(0,168,80,0.10)', color: '#00A850' },
  especes: { bg: '#F3F4F6', color: '#374151' },
}

function MethodBadge({ method }) {
  const key = method || 'especes'
  const s = METHOD_STYLES[key] || METHOD_STYLES.especes
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold" style={{ background: s.bg, color: s.color }}>{METHOD_LABELS[key] || key}</span>
}

function initials(name = '') { return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() }

const METHOD_FILTERS = ['Tous', 'Espèces', 'Wave', 'Orange Money']

export default function PaiementsPage() {
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('Tous')
  const [allPayments, setAllPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSales().then(res => {
      const sales = res.data || res || []
      const payments = sales.flatMap(sale => (sale.payments || []).map(p => ({
        ...p,
        sale_reference: sale.reference,
        sale_id: sale.id,
        client_name: sale.client?.name || '—',
        client_city: sale.client?.city || '',
        article: sale.article?.name || '—',
      }))).sort((a, b) => new Date(b.payment_date || b.date) - new Date(a.payment_date || a.date))
      setAllPayments(payments)
    }).catch(() => setAllPayments([])).finally(() => setLoading(false))
  }, [])

  const totalEncaisse = allPayments.reduce((acc, p) => acc + (p.amount || 0), 0)
  const now = new Date()
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const totalCeMois = allPayments.filter(p => (p.payment_date || p.date || '').startsWith(monthPrefix)).reduce((acc, p) => acc + (p.amount || 0), 0)
  const avgAmount = allPayments.length ? Math.round(totalEncaisse / allPayments.length) : 0

  const filtered = allPayments.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || (p.client_name || '').toLowerCase().includes(q) || (p.sale_reference || '').toLowerCase().includes(q) || (p.receipt_no || '').toLowerCase().includes(q) || (p.article || '').toLowerCase().includes(q)
    const matchMethod = methodFilter === 'Tous' || (p.payment_method || 'especes').replace('_', ' ').toLowerCase() === methodFilter.toLowerCase()
    return matchSearch && matchMethod
  })

  const filteredTotal = filtered.reduce((acc, p) => acc + (p.amount || 0), 0)

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
          <p className="text-sm text-gray-500 mt-0.5">{allPayments.length} paiements enregistrés</p>
        </div>
        <button className="btn btn-secondary gap-2"><Download size={15} /> Exporter CSV</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Wallet, bg: '#DBEAFE', color: BLUE, label: 'Total encaissé', value: formatAmount(totalEncaisse) },
          { icon: Calendar, bg: '#DCFCE7', color: SUCCESS, label: 'Ce mois', value: formatAmount(totalCeMois) },
          { icon: Receipt, bg: '#F3F4F6', color: '#374151', label: 'Nb de paiements', value: allPayments.length },
          { icon: TrendingUp, bg: '#F3F4F6', color: NAVY, label: 'Montant moyen', value: formatAmount(avgAmount) },
        ].map(({ icon: Icon, bg, color, label, value }) => (
          <div key={label} className="card p-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}><Icon size={16} style={{ color }} /></div>
            <div className="text-3xl font-bold amount" style={{ color: '#111827' }}>{value}</div>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="search" placeholder="Chercher par client, référence…" value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {METHOD_FILTERS.map(m => (
            <button key={m} onClick={() => setMethodFilter(m)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${methodFilter === m ? 'text-white border-transparent' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              style={methodFilter === m ? { background: NAVY, borderColor: NAVY } : {}}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="card hidden md:block overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr>{['Reçu', 'Date', 'Client', 'Article', 'Référence', 'Mode', 'Type', 'Montant'].map(h => <th key={h} className="table-header text-left whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={i} className="table-row">
                <td className="table-cell"><span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 border border-gray-200">{p.receipt_no || '—'}</span></td>
                <td className="table-cell text-gray-600 whitespace-nowrap">{formatDate(p.payment_date || p.date)}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ background: BLUE }}>{initials(p.client_name)}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.client_name}</p>
                      <p className="text-xs text-gray-400">{p.client_city}</p>
                    </div>
                  </div>
                </td>
                <td className="table-cell max-w-[160px] truncate text-gray-600">{p.article}</td>
                <td className="table-cell"><Link to={`/ventes/${p.sale_id}`} className="font-mono text-xs hover:underline" style={{ color: BLUE }}>{p.sale_reference}</Link></td>
                <td className="table-cell"><MethodBadge method={p.payment_method} /></td>
                <td className="table-cell"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${p.type === 'acompte' ? 'bg-blue-50 text-blue-700' : p.type === 'solde' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{p.type === 'acompte' ? 'Acompte' : p.type === 'solde' ? 'Solde' : 'Tranche'}</span></td>
                <td className="table-cell text-right"><span className="amount text-sm font-bold" style={{ color: SUCCESS }}>{formatAmount(p.amount)}</span></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="px-5 py-14 text-center text-gray-400 text-sm">Aucun paiement trouvé.</td></tr>}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={7} className="px-5 py-3 text-xs font-semibold text-gray-500">Total ({filtered.length})</td>
                <td className="px-5 py-3 text-right"><span className="amount text-sm font-bold text-gray-900">{formatAmount(filteredTotal)}</span></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="md:hidden space-y-2">
        {filtered.map((p, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 border border-gray-200">{p.receipt_no || '—'}</span>
                  <MethodBadge method={p.payment_method} />
                </div>
                <p className="text-sm font-semibold text-gray-900">{p.client_name}</p>
                <p className="text-xs text-gray-500 truncate">{p.article}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="amount text-sm font-bold" style={{ color: SUCCESS }}>{formatAmount(p.amount)}</p>
                <p className="text-xs text-gray-400">{formatDate(p.payment_date || p.date)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <Link to={`/ventes/${p.sale_id}`} className="font-mono text-xs hover:underline" style={{ color: BLUE }}>{p.sale_reference}</Link>
              <span className={`text-xs font-medium ${p.type === 'acompte' ? 'text-blue-600' : p.type === 'solde' ? 'text-green-600' : 'text-gray-500'}`}>{p.type === 'acompte' ? 'Acompte' : p.type === 'solde' ? 'Solde' : 'Tranche'}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card p-10 text-center">
            <CreditCard size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Aucun paiement trouvé.</p>
          </div>
        )}
      </div>
    </div>
  )
}
