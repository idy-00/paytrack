import { useState, useEffect } from 'react'
import { Building2, Users, CreditCard, Clock, CheckCircle, XCircle, Loader2, Search, DollarSign, TrendingUp, AlertTriangle, Zap, Shield, FileText, Eye } from 'lucide-react'
import { api } from '@/lib/api'
import { formatAmount } from '@/lib/utils'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'https://paytrack.sn/backend/public/api'

export default function AtaabaAdminPage() {
  const [stats, setStats] = useState(null)
  const [tenants, setTenants] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [kycDocuments, setKycDocuments] = useState([])
  const [intechBalance, setIntechBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [search, setSearch] = useState('')
  const [processing, setProcessing] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('paytrack-token')}`
  })

  const loadData = async () => {
    try {
      const [statsRes, tenantsRes, withdrawalsRes, kycRes, balanceRes] = await Promise.all([
        fetch(`${API_URL}/ataaba-admin/dashboard`, { headers: authHeaders() }).then(r => r.json()).catch(() => ({})),
        fetch(`${API_URL}/ataaba-admin/tenants`, { headers: authHeaders() }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_URL}/ataaba-admin/withdrawals?status=pending`, { headers: authHeaders() }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_URL}/ataaba-admin/kyc-documents?status=pending`, { headers: authHeaders() }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_URL}/ataaba-admin/intech-balance`, { headers: authHeaders() }).then(r => r.json()).catch(() => null),
      ])
      setStats(statsRes)
      setTenants(tenantsRes?.data || [])
      setWithdrawals(withdrawalsRes?.data || [])
      setKycDocuments(kycRes?.data || [])
      setIntechBalance(balanceRes)
    } catch (err) {
      toast.error('Erreur chargement (accès admin requis)')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawalAction = async (id, action) => {
    if (action === 'reject') {
      const reason = prompt('Motif du refus:')
      if (!reason) return
      setProcessing(id)
      try {
        await fetch(`${API_URL}/ataaba-admin/withdrawals/${id}/process`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ action: 'reject', reason })
        })
        toast.success('Retrait refusé')
        loadData()
      } catch (err) {
        toast.error('Erreur')
      } finally {
        setProcessing(null)
      }
      return
    }

    if (action === 'approve') {
      const ref = prompt('Référence du virement (manuel):')
      if (!ref) return
      setProcessing(id)
      try {
        await fetch(`${API_URL}/ataaba-admin/withdrawals/${id}/process`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ action: 'approve', payout_reference: ref })
        })
        toast.success('Retrait approuvé (manuel)')
        loadData()
      } catch (err) {
        toast.error('Erreur')
      } finally {
        setProcessing(null)
      }
      return
    }

    if (action === 'auto_cashout') {
      setProcessing(id)
      try {
        const res = await fetch(`${API_URL}/ataaba-admin/withdrawals/${id}/process`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ action: 'auto_cashout' })
        })
        const data = await res.json()
        if (res.ok) {
          toast.success('CashOut automatique initié')
        } else {
          toast.error(data.message || 'CashOut échoué')
        }
        loadData()
      } catch (err) {
        toast.error('Erreur')
      } finally {
        setProcessing(null)
      }
    }
  }

  const handleKycAction = async (docId, action) => {
    if (action === 'reject') {
      const reason = prompt('Motif du rejet:')
      if (!reason) return
    }
    setProcessing(`kyc-${docId}`)
    try {
      await fetch(`${API_URL}/ataaba-admin/kyc-documents/${docId}/review`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          action,
          reason: action === 'reject' ? prompt('Motif du rejet:') : null
        })
      })
      toast.success(action === 'approve' ? 'Document validé' : 'Document rejeté')
      loadData()
    } catch (err) {
      toast.error('Erreur')
    } finally {
      setProcessing(null)
    }
  }

  const filteredTenants = tenants.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const pendingKycCount = kycDocuments.length
  const pendingWithdrawalsCount = withdrawals.length

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administration ATAABA</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tableau de bord super admin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats?.tenants?.total || 0}</p>
              <p className="text-sm text-gray-500">Entreprises</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CreditCard size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">{stats?.tenants?.active || 0}</p>
              <p className="text-sm text-gray-500">Actifs</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-600">{stats?.tenants?.trial || 0}</p>
              <p className="text-sm text-gray-500">En essai</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <DollarSign size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{formatAmount(stats?.wallets?.total_balance || 0)}</p>
              <p className="text-sm text-gray-500">Wallets</p>
            </div>
          </div>
        </div>
        {/* Intech Balance */}
        <div className={`card p-5 ${intechBalance?.balance ? '' : 'opacity-60'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              intechBalance?.configured ? 'bg-emerald-100' : 'bg-gray-100'
            }`}>
              <Zap size={24} className={intechBalance?.configured ? 'text-emerald-600' : 'text-gray-400'} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {intechBalance?.balance ? formatAmount(intechBalance.balance.available || intechBalance.balance.balance || 0) : '-'}
              </p>
              <p className="text-sm text-gray-500">Solde Intech</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="flex flex-wrap gap-4">
        {pendingWithdrawalsCount > 0 && (
          <div className="card p-4 bg-amber-50 border border-amber-200 flex items-center gap-3">
            <AlertTriangle size={20} className="text-amber-600" />
            <span className="font-medium text-amber-800">{pendingWithdrawalsCount} retrait(s) en attente</span>
            <button onClick={() => setActiveTab('withdrawals')} className="text-sm text-amber-600 underline ml-2">Voir</button>
          </div>
        )}
        {pendingKycCount > 0 && (
          <div className="card p-4 bg-blue-50 border border-blue-200 flex items-center gap-3">
            <Shield size={20} className="text-blue-600" />
            <span className="font-medium text-blue-800">{pendingKycCount} document(s) KYC à valider</span>
            <button onClick={() => setActiveTab('kyc')} className="text-sm text-blue-600 underline ml-2">Voir</button>
          </div>
        )}
        {intechBalance && !intechBalance.configured && (
          <div className="card p-4 bg-red-50 border border-red-200 flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-600" />
            <span className="font-medium text-red-800">API Intech non configurée (CashOut manuel uniquement)</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {[
          { id: 'overview', label: 'Vue d\'ensemble' },
          { id: 'tenants', label: 'Entreprises' },
          { id: 'withdrawals', label: `Retraits${pendingWithdrawalsCount ? ` (${pendingWithdrawalsCount})` : ''}` },
          { id: 'kyc', label: `KYC${pendingKycCount ? ` (${pendingKycCount})` : ''}` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Inscriptions récentes</h3>
            </div>
            {tenants.slice(0, 5).map(tenant => (
              <div key={tenant.id} className="p-4 border-b border-gray-50 last:border-0 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{tenant.name}</p>
                  <p className="text-xs text-gray-500">{tenant.email}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  tenant.subscription?.status === 'active' ? 'bg-green-100 text-green-700' :
                  tenant.subscription?.status === 'trial' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {tenant.subscription?.plan?.name || 'Aucun plan'}
                </span>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Revenus</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total reçu</span>
                <span className="text-2xl font-bold">{formatAmount(stats?.revenue?.total || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Ce mois</span>
                <span className="text-xl font-bold text-green-600">{formatAmount(stats?.revenue?.this_month || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Retraits en attente</span>
                <span className="text-xl font-bold text-amber-600">{formatAmount(stats?.wallets?.pending_withdrawals || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tenants' && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Rechercher une entreprise..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header text-left">Entreprise</th>
                  <th className="table-header text-left">Plan</th>
                  <th className="table-header text-left">Statut</th>
                  <th className="table-header text-left">KYC</th>
                  <th className="table-header text-left">Wallet</th>
                  <th className="table-header text-left">Inscrit</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map(tenant => (
                  <tr key={tenant.id} className="table-row">
                    <td className="table-cell">
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-xs text-gray-500">{tenant.email}</p>
                    </td>
                    <td className="table-cell font-medium">{tenant.subscription?.plan?.name || '-'}</td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        tenant.subscription?.status === 'active' ? 'bg-green-100 text-green-700' :
                        tenant.subscription?.status === 'trial' ? 'bg-amber-100 text-amber-700' :
                        tenant.subscription?.status === 'expired' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {tenant.subscription?.status || 'Aucun'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        tenant.kyc_status === 'approved' ? 'bg-green-100 text-green-700' :
                        tenant.kyc_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        tenant.kyc_status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {tenant.kyc_status || 'none'}
                      </span>
                    </td>
                    <td className="table-cell font-medium">{formatAmount(tenant.wallet?.balance || 0)}</td>
                    <td className="table-cell text-gray-600">
                      {new Date(tenant.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="card overflow-x-auto">
          {withdrawals.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <CheckCircle size={48} className="mx-auto mb-3 opacity-50" />
              <p>Aucune demande de retrait en attente</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header text-left">Entreprise</th>
                  <th className="table-header text-left">Montant</th>
                  <th className="table-header text-left">Méthode</th>
                  <th className="table-header text-left">Compte</th>
                  <th className="table-header text-left">KYC</th>
                  <th className="table-header text-left">Date</th>
                  <th className="table-header text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(wd => (
                  <tr key={wd.id} className="table-row">
                    <td className="table-cell font-medium">{wd.tenant?.name}</td>
                    <td className="table-cell font-bold text-lg">{formatAmount(wd.amount)}</td>
                    <td className="table-cell">
                      <span className="uppercase text-xs font-medium bg-gray-100 px-2 py-1 rounded">
                        {wd.payout_method}
                      </span>
                    </td>
                    <td className="table-cell font-mono text-sm">{wd.payout_account}</td>
                    <td className="table-cell">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        wd.tenant?.kyc_status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {wd.tenant?.kyc_status === 'approved' ? 'OK' : 'Non'}
                      </span>
                    </td>
                    <td className="table-cell text-gray-600 text-sm">
                      {new Date(wd.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-wrap gap-2">
                        {intechBalance?.configured && wd.tenant?.kyc_status === 'approved' && (
                          <button
                            onClick={() => handleWithdrawalAction(wd.id, 'auto_cashout')}
                            disabled={processing === wd.id}
                            className="btn btn-primary btn-sm flex items-center gap-1"
                          >
                            {processing === wd.id ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                            CashOut
                          </button>
                        )}
                        <button
                          onClick={() => handleWithdrawalAction(wd.id, 'approve')}
                          disabled={processing === wd.id}
                          className="btn btn-secondary btn-sm flex items-center gap-1"
                        >
                          <CheckCircle size={14} />
                          Manuel
                        </button>
                        <button
                          onClick={() => handleWithdrawalAction(wd.id, 'reject')}
                          disabled={processing === wd.id}
                          className="btn btn-ghost btn-sm text-red-600 flex items-center gap-1"
                        >
                          <XCircle size={14} />
                          Refuser
                        </button>
                      </div>
                      {wd.admin_notes && (
                        <p className="text-xs text-amber-600 mt-1">{wd.admin_notes}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'kyc' && (
        <div className="card overflow-x-auto">
          {kycDocuments.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Shield size={48} className="mx-auto mb-3 opacity-50" />
              <p>Aucun document KYC en attente de validation</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header text-left">Entreprise</th>
                  <th className="table-header text-left">Type</th>
                  <th className="table-header text-left">Fichier</th>
                  <th className="table-header text-left">Soumis le</th>
                  <th className="table-header text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {kycDocuments.map(doc => (
                  <tr key={doc.id} className="table-row">
                    <td className="table-cell">
                      <p className="font-medium">{doc.tenant?.name}</p>
                      <p className="text-xs text-gray-500">{doc.tenant?.email}</p>
                    </td>
                    <td className="table-cell">
                      <span className="flex items-center gap-2">
                        <FileText size={16} className="text-gray-400" />
                        {doc.document_type === 'identity' ? 'Pièce d\'identité' : 'Justificatif domicile'}
                      </span>
                    </td>
                    <td className="table-cell text-sm text-gray-600">{doc.original_filename}</td>
                    <td className="table-cell text-gray-600">
                      {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <a
                          href={`${API_URL}/kyc/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm flex items-center gap-1"
                        >
                          <Eye size={14} />
                          Voir
                        </a>
                        <button
                          onClick={() => handleKycAction(doc.id, 'approve')}
                          disabled={processing === `kyc-${doc.id}`}
                          className="btn btn-primary btn-sm flex items-center gap-1"
                        >
                          <CheckCircle size={14} />
                          Valider
                        </button>
                        <button
                          onClick={() => handleKycAction(doc.id, 'reject')}
                          disabled={processing === `kyc-${doc.id}`}
                          className="btn btn-ghost btn-sm text-red-600 flex items-center gap-1"
                        >
                          <XCircle size={14} />
                          Rejeter
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
