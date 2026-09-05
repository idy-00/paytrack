import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Download, FileText, TrendingUp, Building2, Users,
  RefreshCw, Calendar, Filter, BarChart3, PieChart
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatAmount } from '@/lib/utils'
import toast from 'react-hot-toast'

const PERIODS = [
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
  { value: 'quarter', label: 'Ce trimestre' },
  { value: 'year', label: 'Cette année' },
]

const METHOD_LABELS = {
  especes: 'Espèces',
  wave: 'Wave',
  orange_money: 'Orange Money',
  free_money: 'Free Money',
  virement: 'Virement',
  cheque: 'Chèque',
}

export default function AdminRapportsPage() {
  const [period, setPeriod] = useState('month')
  const [reports, setReports] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [period])

  const loadReports = async () => {
    setLoading(true)
    try {
      const data = await api.getAdminReports(`?period=${period}`)
      setReports(data)
    } catch (err) {
      toast.error('Erreur chargement rapports')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const totalRevenue = reports?.salesByShop?.reduce((acc, s) => acc + (s.total_revenue || 0), 0) || 0
  const totalActive = reports?.salesByShop?.reduce((acc, s) => acc + (s.active_sales_count || 0), 0) || 0
  const totalOverdue = reports?.salesByShop?.reduce((acc, s) => acc + (s.overdue_sales_count || 0), 0) || 0

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="btn btn-ghost btn-icon">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rapports & Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Vue consolidée de l'activité</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={loadReports} className="btn btn-secondary gap-2">
            <RefreshCw size={16} /> Actualiser
          </button>
          <button onClick={() => api.exportSales()} className="btn btn-primary gap-2">
            <Download size={16} /> Exporter
          </button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex items-center gap-3">
        <Filter size={16} className="text-gray-400" />
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">CA période</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatAmount(totalRevenue)}</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <BarChart3 size={20} className="text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">Ventes actives</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalActive}</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Calendar size={20} className="text-amber-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">Ventes en retard</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalOverdue}</p>
        </div>
      </div>

      {/* Performance par boutique */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 size={18} className="text-gray-400" />
          <h2 className="font-semibold text-gray-900">Performance par boutique</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Boutique</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">CA période</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Actives</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Retard</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(reports?.salesByShop || []).map(shop => {
                const performance = shop.overdue_sales_count > 0
                  ? Math.round(((shop.active_sales_count) / (shop.active_sales_count + shop.overdue_sales_count)) * 100)
                  : 100
                return (
                  <tr key={shop.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{shop.name}</p>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {formatAmount(shop.total_revenue || 0)}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{shop.active_sales_count}</td>
                    <td className="px-5 py-4">
                      <span className={shop.overdue_sales_count > 0 ? 'text-amber-600 font-medium' : 'text-gray-400'}>
                        {shop.overdue_sales_count}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${performance}%`,
                              backgroundColor: performance >= 80 ? '#44AC45' : performance >= 60 ? '#D97706' : '#DC2626'
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-500">{performance}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {(!reports?.salesByShop || reports.salesByShop.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                    Aucune donnée disponible
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Méthodes de paiement */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <PieChart size={18} className="text-gray-400" />
          <h2 className="font-semibold text-gray-900">Répartition des paiements</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(reports?.paymentMethods || []).map(method => (
              <div key={method.payment_method} className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">
                  {METHOD_LABELS[method.payment_method] || method.payment_method}
                </p>
                <p className="text-xl font-bold text-gray-900">{formatAmount(method.total)}</p>
                <p className="text-xs text-gray-400">{method.count} paiements</p>
              </div>
            ))}
            {(!reports?.paymentMethods || reports.paymentMethods.length === 0) && (
              <p className="col-span-4 text-center text-gray-400 py-4">
                Aucun paiement sur cette période
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Évolution mensuelle */}
      {reports?.monthlySales && reports.monthlySales.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <BarChart3 size={18} className="text-gray-400" />
            <h2 className="font-semibold text-gray-900">Évolution mensuelle (12 derniers mois)</h2>
          </div>
          <div className="p-5">
            <div className="flex items-end gap-2 h-40">
              {reports.monthlySales.map((m, i) => {
                const maxTotal = Math.max(...reports.monthlySales.map(x => x.total || 1))
                const height = ((m.total || 0) / maxTotal) * 100
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all"
                      style={{ height: `${height}%`, minHeight: 4 }}
                    />
                    <p className="text-[10px] text-gray-400 mt-1 whitespace-nowrap">
                      {m.month.slice(5)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
