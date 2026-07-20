import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, AlertCircle, CheckCircle2, ArrowRight, Plus,
  ArrowUpRight, Bell, ShoppingBag, Users, CalendarClock, Wallet,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  MOCK_SALES, DASHBOARD_STATS, formatAmount, formatDate, getProgressPercent,
} from '@/lib/mockData'
import { useAuthStore } from '@/store/authStore'
import StatusBadge from '@/components/ui/StatusBadge'
import ProgressBar from '@/components/ui/ProgressBar'

/* ── palette ── */
const BLUE    = '#1A56DB'
const INK     = '#111827'
const SUCCESS = '#16A34A'
const WARNING = '#D97706'
const DANGER  = '#DC2626'
const PURPLE  = '#7C3AED'

/* ── helpers ── */
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

/* ── Avatar ── */
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

/* ── ChartTooltip ── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs bg-[#0F2744] border border-blue-900/40">
      <p className="text-blue-300 mb-1">{label}</p>
      <p className="amount font-bold text-blue-400">{formatAmount(payload[0]?.value)}</p>
      {payload[1] && (
        <p className="text-blue-300/70 mt-0.5">Obj. {formatAmount(payload[1]?.value)}</p>
      )}
    </div>
  )
}

/* ── KpiCard ── */
function KpiCard({ color, bgColor, icon: Icon, label, value, trend, trendUp }) {
  return (
    <div className="card overflow-hidden">
      <div style={{ height: 2, background: color }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: bgColor }}
          >
            <Icon size={18} style={{ color }} />
          </div>
          {trend && (
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
              trendUp ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
            }`}>
              <ArrowUpRight size={11} />
              {trend}
            </span>
          )}
        </div>
        <div className="text-3xl font-bold amount" style={{ color: INK }}>{value}</div>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  )
}

/* ── UpcomingSchedule ── */
function UpcomingSchedule() {
  const items = MOCK_SALES
    .flatMap(s => s.schedule.map(sc => ({ ...sc, sale: s })))
    .filter(sc => sc.status === 'en_attente' || sc.status === 'retard')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5)

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <CalendarClock size={15} style={{ color: BLUE }} />
          Prochaines échéances
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
              to={`/ventes/${sc.sale.id}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border hover:bg-gray-50 transition-colors"
              style={{
                borderColor: late ? `${DANGER}30` : '#E5E7EB',
                background: late ? `${DANGER}05` : 'white',
              }}
            >
              <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: late ? DANGER : BLUE }} />
              <div className="flex-shrink-0 w-16">
                <p className="font-mono text-xs font-semibold" style={{ color: late ? DANGER : INK }}>
                  {formatDate(sc.due_date)}
                </p>
                {days != null && (
                  <p className="text-[10px] font-bold" style={{ color: DANGER }}>J+{days}</p>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{sc.sale.client.name}</p>
                <p className="text-xs text-gray-500 truncate">{sc.sale.article.name}</p>
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
            <p className="text-sm">Aucune échéance imminente</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── RecentActivity ── */
function RecentActivity() {
  const events = [
    { icon: CheckCircle2, iconColor: SUCCESS, iconBg: '#DCFCE7',
      title: 'Paiement reçu', sub: 'Aminata Ndiaye · 108 334 FCFA', time: 'Il y a 23 min' },
    { icon: ShoppingBag, iconColor: BLUE, iconBg: '#DBEAFE',
      title: 'Nouvelle vente', sub: 'Rokhaya Diop · Galaxy S24 Ultra', time: 'Il y a 2h' },
    { icon: AlertCircle, iconColor: WARNING, iconBg: '#FEF3C7',
      title: 'Retard signalé', sub: 'Cheikh Mbaye · Tranche 3', time: 'Il y a 4h' },
    { icon: CheckCircle2, iconColor: SUCCESS, iconBg: '#DCFCE7',
      title: 'Dossier soldé', sub: 'Ibrahima Fall · HP Victus 15', time: 'Hier 14h' },
    { icon: Users, iconColor: PURPLE, iconBg: '#EDE9FE',
      title: 'Nouveau client', sub: 'Rokhaya Diop enregistrée', time: 'Hier 11h' },
  ]
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={15} style={{ color: BLUE }} />
        <h2 className="text-sm font-semibold text-gray-900">Activité récente</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {events.map((ev, i) => {
          const Icon = ev.icon
          return (
            <div key={i} className="flex items-start gap-3 py-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: ev.iconBg }}
              >
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
      </div>
    </div>
  )
}

/* ── TopClients ── */
function TopClients() {
  const clients = [
    { name: 'Aminata Ndiaye', amount: 450000, pct: 85,  color: BLUE    },
    { name: 'Ibrahima Fall',  amount: 550000, pct: 100, color: SUCCESS  },
    { name: 'Fatou Sarr',     amount: 150000, pct: 21,  color: PURPLE   },
    { name: 'Cheikh Mbaye',   amount: 240000, pct: 50,  color: WARNING  },
    { name: 'Rokhaya Diop',   amount: 50000,  pct: 27,  color: DANGER   },
  ]
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Users size={15} style={{ color: BLUE }} />
          Top clients
        </h2>
        <Link to="/clients" className="text-xs font-medium" style={{ color: BLUE }}>Voir tout</Link>
      </div>
      <div className="space-y-3">
        {clients.map(({ name, amount, pct, color }) => (
          <div key={name} className="flex items-center gap-3">
            <Avatar name={name} size={30} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium text-gray-900 truncate">{name}</span>
                <span className="amount text-xs font-semibold text-gray-600 ml-2 flex-shrink-0">
                  {formatAmount(amount)}
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── VendeurDashboard ── */
export default function VendeurDashboard() {
  const { user } = useAuthStore()
  const stats = DASHBOARD_STATS
  const lateSales = MOCK_SALES.filter(s => s.status === 'retard')
  const [chartType, setChartType] = useState('area')

  const today = new Date().toLocaleDateString('fr-SN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const barColors = stats.monthly_data.map((_, i) =>
    i === stats.monthly_data.length - 1 ? BLUE : '#CBD5E1'
  )

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap pt-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/ventes" className="btn btn-secondary btn-sm gap-1.5">
            <ShoppingBag size={14} /> Ventes
          </Link>
          <Link to="/ventes/nouvelle" className="btn btn-primary gap-1.5">
            <Plus size={14} /> Nouvelle vente
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          color={BLUE} bgColor="#DBEAFE"
          icon={Wallet} label="Total encaissé"
          value={formatAmount(stats.total_encaisse)}
          trend="+8%" trendUp
        />
        <KpiCard
          color={SUCCESS} bgColor="#DCFCE7"
          icon={ShoppingBag} label="Ventes actives"
          value={String(stats.ventes_actives)}
        />
        <KpiCard
          color={WARNING} bgColor="#FEF3C7"
          icon={AlertCircle} label="En retard"
          value={String(stats.ventes_en_retard)}
          trend="-15%"
        />
        <KpiCard
          color={SUCCESS} bgColor="#DCFCE7"
          icon={CheckCircle2} label="Soldées"
          value={String(stats.ventes_soldees)}
        />
      </div>

      {/* Chart + Retards */}
      <div className="grid xl:grid-cols-[1fr_340px] gap-5">

        {/* Chart */}
        <div className="card p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <TrendingUp size={15} style={{ color: BLUE }} />
                Encaissements mensuels
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">6 derniers mois</p>
            </div>
            <div className="flex gap-1 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
              {[['area', 'Courbe'], ['bar', 'Barres']].map(([t, l]) => (
                <button
                  key={t}
                  onClick={() => setChartType(t)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    chartType === t
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={stats.monthly_data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={BLUE}  stopOpacity={0.18} />
                      <stop offset="95%" stopColor={BLUE}  stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gObj" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#94A3B8" stopOpacity={0.08} />
                      <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={false} tickLine={false} tickFormatter={v => (v / 1000) + 'k'} width={36} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="objectif"
                    stroke="#CBD5E1" strokeWidth={1.5} strokeDasharray="5 4" fill="url(#gObj)" dot={false} />
                  <Area type="monotone" dataKey="encaisse"
                    stroke={BLUE} strokeWidth={2.5} fill="url(#gBlue)" dot={false}
                    activeDot={{ r: 5, fill: '#FFFFFF', stroke: BLUE, strokeWidth: 2 }} />
                </AreaChart>
              ) : (
                <BarChart data={stats.monthly_data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={false} tickLine={false} tickFormatter={v => (v / 1000) + 'k'} width={36} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="encaisse" radius={[6, 6, 0, 0]}>
                    {stats.monthly_data.map((_, i) => <Cell key={i} fill={barColors[i]} />)}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="flex gap-4 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 rounded-full" style={{ background: BLUE }} />
              Encaissé
            </span>
            {chartType === 'area' && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-px rounded-full bg-gray-300" />
                Objectif
              </span>
            )}
          </div>
        </div>

        {/* Retards */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <AlertCircle size={15} style={{ color: WARNING }} />
              Retards
            </h2>
            <span
              className="amount text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: '#FEF3C7', color: WARNING }}
            >
              {lateSales.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {lateSales.map(sale => {
              const pct = getProgressPercent(sale.paid_amount, sale.total_amount)
              const days = daysOverdue(
                sale.schedule.find(sc => sc.status === 'retard')?.due_date || sale.end_date
              )
              return (
                <Link
                  key={sale.id}
                  to={`/ventes/${sale.id}`}
                  className="block px-3 py-3 rounded-lg border hover:bg-red-50 transition-colors"
                  style={{ borderColor: `${DANGER}25`, background: `${DANGER}04` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{sale.client.name}</p>
                      <p className="text-xs text-gray-500">{sale.article.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="amount text-xs font-bold" style={{ color: DANGER }}>
                        {formatAmount(sale.remaining_amount)}
                      </p>
                      {days > 0 && (
                        <p className="text-[10px] font-bold" style={{ color: DANGER }}>J+{days}</p>
                      )}
                    </div>
                  </div>
                  <ProgressBar percent={pct} status={sale.status} showLabel />
                </Link>
              )
            })}
            {lateSales.length === 0 && (
              <div className="flex flex-col items-center py-8 gap-2 text-gray-400">
                <CheckCircle2 size={22} style={{ color: SUCCESS }} />
                <p className="text-sm">Aucun retard. Excellent !</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3-column grid */}
      <div className="grid xl:grid-cols-3 gap-5">
        <UpcomingSchedule />
        <RecentActivity />
        <TopClients />
      </div>

      {/* Table ventes récentes */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <ShoppingBag size={15} style={{ color: BLUE }} />
            Ventes récentes
          </h2>
          <Link to="/ventes" className="flex items-center gap-1 text-xs font-medium" style={{ color: BLUE }}>
            Voir tout <ArrowRight size={11} />
          </Link>
        </div>

        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full" role="table" aria-label="Ventes récentes">
            <thead>
              <tr>
                {['Référence', 'Client', 'Article', 'Total', 'Payé', 'Progression', 'Statut', ''].map(h => (
                  <th key={h} className="table-header text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_SALES.map(sale => {
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
                        <Avatar name={sale.client.name} size={28} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{sale.client.name}</p>
                          <p className="text-xs text-gray-500">{sale.client.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell max-w-[160px] truncate">{sale.article.name}</td>
                    <td className="table-cell">
                      <span className="amount font-semibold text-gray-900">
                        {formatAmount(sale.total_amount)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="amount text-gray-600">
                        {formatAmount(sale.paid_amount)}
                      </span>
                    </td>
                    <td className="table-cell w-32">
                      <ProgressBar percent={pct} status={sale.status} showLabel />
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={sale.status} />
                    </td>
                    <td className="table-cell">
                      <Link
                        to={`/ventes/${sale.id}`}
                        className="btn btn-ghost btn-icon btn-sm"
                        aria-label={`Voir ${sale.reference}`}
                      >
                        <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {MOCK_SALES.map(sale => {
            const pct = getProgressPercent(sale.paid_amount, sale.total_amount)
            return (
              <Link
                key={sale.id}
                to={`/ventes/${sale.id}`}
                className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors"
              >
                <Avatar name={sale.client.name} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-semibold text-gray-900">{sale.client.name}</span>
                    <StatusBadge status={sale.status} size="sm" />
                  </div>
                  <p className="text-xs text-gray-500 truncate mb-2">{sale.article.name}</p>
                  <div className="flex justify-between mb-1.5">
                    <span className="amount text-xs font-semibold text-gray-900">
                      {formatAmount(sale.paid_amount)}
                    </span>
                    <span className="amount text-xs text-gray-400">
                      / {formatAmount(sale.total_amount)}
                    </span>
                  </div>
                  <ProgressBar percent={pct} status={sale.status} showLabel />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Mobile FAB */}
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
