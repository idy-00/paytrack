import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2, Users, ShoppingBag, TrendingUp, AlertTriangle,
  DollarSign, Calendar, ArrowUpRight, ArrowDownRight, RefreshCw,
  FileText, Download, Settings, Shield
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { formatAmount } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminDashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [shops, setShops] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, shopsRes] = await Promise.all([
        api.getAdminStats(),
        api.getShops(),
      ])
      setStats(statsRes)
      setShops(shopsRes.data || shopsRes)
    } catch (err) {
      toast.error('Erreur chargement données')
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

  const kpis = [
    {
      label: 'Chiffre d\'affaires total',
      value: formatAmount(stats?.totalRevenue || 0),
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
      trend: '+12%',
      trendUp: true
    },
    {
      label: 'Ventes en cours',
      value: stats?.activeSales || 0,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Ventes en retard',
      value: stats?.overdueSales || 0,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Boutiques actives',
      value: shops.length,
      icon: Building2,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
          <p className="text-sm text-gray-500 mt-1">
            Vue d'ensemble de l'entreprise • Connecté en tant que {user?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="btn btn-secondary gap-2">
            <RefreshCw size={16} /> Actualiser
          </button>
          <Link to="/admin/parametres" className="btn btn-secondary gap-2">
            <Settings size={16} /> Paramètres
          </Link>
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <Shield size={20} className="text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-blue-900">Espace sécurisé</p>
          <p className="text-xs text-blue-700">
            Accès réservé aux administrateurs. Toutes les actions sont enregistrées.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg, trend, trendUp }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between">
              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon size={20} className={color} />
              </div>
              {trend && (
                <span className={`text-xs font-medium flex items-center gap-0.5 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-4">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Link to="/boutiques" className="card p-5 hover:border-blue-300 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <Building2 size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Gérer les boutiques</p>
              <p className="text-sm text-gray-500">{shops.length} boutiques</p>
            </div>
          </div>
        </Link>

        <Link to="/utilisateurs" className="card p-5 hover:border-blue-300 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Users size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Gérer les utilisateurs</p>
              <p className="text-sm text-gray-500">Vendeurs et admins</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/rapports" className="card p-5 hover:border-blue-300 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <FileText size={24} className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Rapports & Exports</p>
              <p className="text-sm text-gray-500">Télécharger les données</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Shops Performance */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Performance par boutique</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Boutique</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Vendeurs</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Ventes actives</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">CA ce mois</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shops.map(shop => (
                <tr key={shop.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{shop.name}</p>
                    <p className="text-xs text-gray-500">{shop.address || 'Adresse non renseignée'}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{shop.users_count || 0}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{shop.active_sales_count || 0}</td>
                  <td className="px-5 py-4 text-sm font-medium text-gray-900">
                    {formatAmount(shop.monthly_revenue || 0)}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      shop.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {shop.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {shops.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                    Aucune boutique configurée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
