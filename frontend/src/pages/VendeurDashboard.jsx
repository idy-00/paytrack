import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, AlertCircle, CheckCircle2, ArrowRight, Plus,
  ArrowUpRight, Bell, ShoppingBag, Users, CalendarClock, Wallet, Loader2,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatAmount, formatDate, getProgressPercent } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useDashboardStore } from '@/store/dashboardStore'
import StatusBadge from '@/components/ui/StatusBadge'
import ProgressBar from '@/components/ui/ProgressBar'

const BLUE    = '#1D6FE8'
const INK     = '#111827'
const SUCCESS = '#16A34A'
const WARNING = '#D97706'
const DANGER  = '#DC2626'
const PURPLE  = '#7C3AED'

function initials(name = '') {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}
const GRADIENTS = [
  `linear-gradient(135deg,${BLUE},#60A5FA)`,
  `linear-gradient(135deg,${SUCCESS},#4ADE80)`,
  `linear-gradient(135deg,${PURPLE},#A78BFA)`,
  `linear-gradient(135deg,${DANGER},#F87171)`,
  `linear-gradient(135deg,${WARNING},#FCD34D)`,
]
function avatarGradient(name = '') {
  const sum = [...name].reduce((a, c) => a + c.charCodeAt(0), 0)
  return GRADIENTS[sum % GRADIENTS.length]
}
function daysOverdue(dueDateStr) {
  const diff = Math.floor((Date.now() - new Date(dueDateStr).getTime()) / 86400000)
  return diff > 0 ? diff : 0
}

function Avatar({ name, size = 32 }) {
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center rounded-full text-white font-bold"
      style={{ width: size, height: size, background: avatarGradient(name), fontSize: size * 0.32 }}
    >
      {initials(name)}
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs bg-white border"
      style={{ borderColor: '#E8E4DD', boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}>
      <p className="mb-1" style={{ color: '#6B7280' }}>{label}</p>
      <p className="amount font-bold" style={{ color: BLUE }}>{formatAmount(payload[0]?.value)}</p>
    </div>
  )
}

function KpiCard({ color, bgColor, icon: Icon, label, value }) {
  return (
    <div className="card overflow-hidden">
      <div style={{ height: 2, background: color }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bgColor }}>
            <Icon size={18} style={{ color }} />
          </div>
        </div>
        <div className="text-3xl font-bold amount" style={{ color: INK }}>{value}</div>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  )
}

function UpcomingSchedule({ schedules }) {
  const items = (schedules || []).slice(0, 5)
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <CalendarClock size={15} style={{ color: BLUE }} />
          Prochaines
        </h2>
        <Link to="/ventes" className="flex items-center gap-1 text-xs font-medium" style={{ color: BLUE }}>
          Voir tout <ArrowRight size={11} />
        </Link>
      </div>
      <div className="space-y-2">
        {items.map((sc, i) => {
          const late = sc.status === 'retard'
          const days = late ? daysOverdue(sc.due_date) : null
          return (
            <Link
              key={i}
              to={`/ventes/${sc.sale_id}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border hover:bg-gray-50 transition-colors"
              style={{ borderColor: late ? `${DANGER}30` : '#E8E4DD', background: late ? `${DANGER}05` : 'white' }}
            >
              <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: late ? DANGER : BLUE }} />
              <div className="flex-shrink-0 w-16">
                <p className="font-mono text-xs font-semibold" style={{ color: late ? DANGER : INK }}>
                  {formatDate(sc.due_date)}
                </p>
                {days != null && <p className="text-[10px] font-bold" style={{ color: DANGER }}>J+{days}</p>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{sc.sale?.client?.name || '—'}</p>
              </div>
              <span className="amount text-sm font-semibold flex-shrink-0" style={{ color: late ? DANGER : INK }}>
                {formatAmount(sc.amount)}
              </span>
            </Link>
          )
        })}
        {items.length === 0 && (
          <div className="flex flex-col items-center py-8 gap-2 text-gray-400">
            <CheckCircle2 size={22} style={{ color: SUCCESS }} />
            <p className="text-sm">Aucune imminente</p>
          </div>
        )}
      </div>
    </div>
  )
}

function RecentActivity({ activity }) {
  const iconMap = {
    payment_received: { icon: CheckCircle2, iconColor: SUCCESS, iconBg: '#DCFCE7' },
    sale_created: { icon: ShoppingBag, iconColor: BLUE, iconBg: '#DBEAFE' },
    late_payment: { icon: AlertCircle, iconColor: WARNING, iconBg: '#FEF3C7' },
    client_created: { icon: Users, iconColor: PURPLE, iconBg: '#EDE9FE' },
  }
  const events = (activity || []).slice(0, 5).map(a => {
    const cfg = iconMap[a.action] || iconMap.sale_created
    return { ...cfg, title: a.action?.replace(/_/g, ' ') || 'Action', sub: a.description || '', time: formatDate(a.created_at) }
  })
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={15} style={{ color: BLUE }} />
        <h2 className="text-sm font-semibold text-gray-900">Activité</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {events.map((ev, i) => {
          const Icon = ev.icon
          return (
            <div key={i} className="flex items-start gap-3 py-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: ev.iconBg }}>
                <Icon size={14} style={{ color: ev.iconColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{ev.title}</p>
                <p className="text-xs text-gray-500 truncate">{ev.sub}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{ev.time}</span>
            </div>
          )
        })}
        {events.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">Aucune activité</p>}
      </div>
    </div>
  )
}

function TopClients({ sales }) {
  const clientMap = {}
  ;(sales || []).forEach(s => {
    const name = s.client?.name || 'Inconnu'
    if (!clientMap[name]) clientMap[name] = { name, paid: 0, total: 0 }
    clientMap[name].paid += s.paid_amount || 0
    clientMap[name].total += s.total_amount || 0
  })
  const clients = Object.values(clientMap)
    .sort((a, b) => b.paid - a.paid)
    .slice(0, 5)
    .map((c, i) => ({ ...c, pct: getProgressPercent(c.paid, c.total), color: [BLUE, SUCCESS, PURPLE, WARNING, DANGER][i % 5] }))

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Users size={15} style={{ color: BLUE }} /> Top clients
        </h2>
        <Link to="/clients" className="text-xs font-medium" style={{ color: BLUE }}>Voir tout</Link>
      </div>
      <div className="space-y-3">
        {clients.map(({ name, paid, pct, color }) => (
          <div key={name} className="flex items-center gap-3">
            <Avatar name={name} size={30} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium text-gray-900 truncate">{name}</span>
                <span className="amount text-xs font-semibold text-gray-600 ml-2 flex-shrink-0">{formatAmount(paid)}</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          </div>
        ))}
        {clients.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucun client</p>}
      </div>
    </div>
  )
}

export default function VendeurDashboard() {
  const { user } = useAuthStore()
  const { stats, sales, upcomingSchedules, activity, loading, fetchAll } = useDashboardStore()
  const [chartType, setChartType] = useState('area')

  useEffect(() => { fetchAll() }, [fetchAll])

  const today = new Date().toLocaleDateString('fr-SN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const lateSales = (sales || []).filter(s => s.status === 'retard')
  const monthlyData = stats?.monthly_data || []
  const barColors = monthlyData.map((_, i) => i === monthlyData.length - 1 ? BLUE : '#CBD5E1')

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-8">
      <div className="flex items-start justify-between gap-4 flex-wrap pt-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bonjour {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/ventes" className="btn btn-secondary btn-sm gap-1.5"><ShoppingBag size={14} /> Ventes</Link>
          <Link to="/ventes/nouvelle" className="btn btn-primary gap-1.5"><Plus size={14} /> Nouvelle vente</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard color={BLUE} bgColor="#DBEAFE" icon={Wallet} label="Total encaissé" value={formatAmount(stats?.total_encaisse || 0)} />
        <KpiCard color={SUCCESS} bgColor="#DCFCE7" icon={ShoppingBag} label="Ventes actives" value={String(stats?.ventes_actives || 0)} />
        <KpiCard color={WARNING} bgColor="#FEF3C7" icon={AlertCircle} label="En retard" value={String(stats?.ventes_en_retard || 0)} />
        <KpiCard color={SUCCESS} bgColor="#DCFCE7" icon={CheckCircle2} label="Soldées" value={String(stats?.ventes_soldees || 0)} />
      </div>

      <div className="grid xl:grid-cols-[1fr_340px] gap-5">
        <div className="card p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <TrendingUp size={15} style={{ color: BLUE }} /> Encaissements
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">6 derniers mois</p>
            </div>
            <div className="flex gap-1 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
              {[['area', 'Courbe'], ['bar', 'Barres']].map(([t, l]) => (
                <button key={t} onClick={() => setChartType(t)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${chartType === t ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >{l}</button>
              ))}
            </div>
          </div>
          <div style={{ height: 200 }}>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BLUE} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => (v / 1000) + 'k'} width={36} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="encaisse" stroke={BLUE} strokeWidth={2.5} fill="url(#gBlue)" dot={false}
                      activeDot={{ r: 5, fill: '#FFFFFF', stroke: BLUE, strokeWidth: 2 }} />
                  </AreaChart>
                ) : (
                  <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => (v / 1000) + 'k'} width={36} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="encaisse" radius={[6, 6, 0, 0]}>
                      {monthlyData.map((_, i) => <Cell key={i} fill={barColors[i]} />)}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">Aucune donnée</div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <AlertCircle size={15} style={{ color: WARNING }} /> Retards
            </h2>
            <span className="amount text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEF3C7', color: WARNING }}>
              {lateSales.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {lateSales.slice(0, 5).map(sale => {
              const pct = getProgressPercent(sale.paid_amount, sale.total_amount)
              return (
                <Link key={sale.id} to={`/ventes/${sale.id}`}
                  className="block px-3 py-3 rounded-lg border hover:bg-red-50 transition-colors"
                  style={{ borderColor: `${DANGER}25`, background: `${DANGER}04` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{sale.client?.name || '—'}</p>
                      <p className="text-xs text-gray-500">{sale.article?.name || '—'}</p>
                    </div>
                    <p className="amount text-xs font-bold" style={{ color: DANGER }}>{formatAmount(sale.remaining_amount)}</p>
                  </div>
                  <ProgressBar percent={pct} status={sale.status} showLabel />
                </Link>
              )
            })}
            {lateSales.length === 0 && (
              <div className="flex flex-col items-center py-8 gap-2 text-gray-400">
                <CheckCircle2 size={22} style={{ color: SUCCESS }} />
                <p className="text-sm">Aucun retard</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-3 gap-5">
        <UpcomingSchedule schedules={upcomingSchedules} />
        <RecentActivity activity={activity} />
        <TopClients sales={sales} />
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <ShoppingBag size={15} style={{ color: BLUE }} /> Ventes récentes
          </h2>
          <Link to="/ventes" className="flex items-center gap-1 text-xs font-medium" style={{ color: BLUE }}>
            Voir tout <ArrowRight size={11} />
          </Link>
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr>
                {['Référence', 'Client', 'Article', 'Total', 'Payé', 'Progression', 'Statut', ''].map(h => (
                  <th key={h} className="table-header text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(sales || []).slice(0, 10).map(sale => {
                const pct = getProgressPercent(sale.paid_amount, sale.total_amount)
                return (
                  <tr key={sale.id} className="table-row">
                    <td className="table-cell">
                      <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 border border-gray-200">
                        {sale.reference}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={sale.client?.name || '?'} size={28} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{sale.client?.name || '—'}</p>
                          <p className="text-xs text-gray-500">{sale.client?.city || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell max-w-[160px] truncate">{sale.article?.name || '—'}</td>
                    <td className="table-cell"><span className="amount font-semibold text-gray-900">{formatAmount(sale.total_amount)}</span></td>
                    <td className="table-cell"><span className="amount text-gray-600">{formatAmount(sale.paid_amount)}</span></td>
                    <td className="table-cell w-32"><ProgressBar percent={pct} status={sale.status} showLabel /></td>
                    <td className="table-cell"><StatusBadge status={sale.status} /></td>
                    <td className="table-cell">
                      <Link to={`/ventes/${sale.id}`} className="btn btn-ghost btn-icon btn-sm"><ArrowRight size={14} /></Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="md:hidden divide-y divide-gray-100">
          {(sales || []).slice(0, 10).map(sale => {
            const pct = getProgressPercent(sale.paid_amount, sale.total_amount)
            return (
              <Link key={sale.id} to={`/ventes/${sale.id}`} className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors">
                <Avatar name={sale.client?.name || '?'} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-semibold text-gray-900">{sale.client?.name || '—'}</span>
                    <StatusBadge status={sale.status} size="sm" />
                  </div>
                  <p className="text-xs text-gray-500 truncate mb-2">{sale.article?.name || '—'}</p>
                  <div className="flex justify-between mb-1.5">
                    <span className="amount text-xs font-semibold text-gray-900">{formatAmount(sale.paid_amount)}</span>
                    <span className="amount text-xs text-gray-400">/ {formatAmount(sale.total_amount)}</span>
                  </div>
                  <ProgressBar percent={pct} status={sale.status} showLabel />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <Link to="/ventes/nouvelle"
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-2xl flex items-center justify-center text-white"
        style={{ background: BLUE, boxShadow: '0 4px 20px rgba(26,86,219,0.40)' }}
      >
        <Plus size={24} />
      </Link>
    </div>
  )
}
