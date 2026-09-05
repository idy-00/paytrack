import { useState, useEffect, useRef } from 'react'
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, Loader2, Send, FileText, Upload, AlertTriangle, Shield } from 'lucide-react'
import { api } from '@/lib/api'
import { formatAmount } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function WalletPage() {
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [kycStatus, setKycStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showKycModal, setShowKycModal] = useState(false)
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', method: 'wave', phone: '' })
  const [withdrawQuote, setWithdrawQuote] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(null)
  const identityInputRef = useRef(null)
  const addressInputRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [walletRes, txRes, wdRes, kycRes] = await Promise.all([
        api.getWallet(),
        api.getWalletTransactions(),
        api.getWithdrawals(),
        api.getKycStatus(),
      ])
      setWallet(walletRes?.wallet || walletRes)
      setTransactions(txRes?.data || txRes || [])
      setWithdrawals(wdRes?.data || wdRes || [])
      setKycStatus(kycRes)
    } catch (err) {
      toast.error('Erreur chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()
    if (!withdrawForm.amount || !withdrawForm.phone) {
      toast.error('Montant et téléphone requis')
      return
    }
    const balance = wallet?.balance || 0
    if (parseInt(withdrawForm.amount) > balance) {
      toast.error('Solde insuffisant')
      return
    }

    setSubmitting(true)
    try {
      const amount = parseInt(withdrawForm.amount)
      if (!withdrawQuote) {
        const response = await api.getWithdrawalQuote({ amount, payout_method: withdrawForm.method })
        setWithdrawQuote(response.quote)
        return
      }
      await api.requestWithdrawal({
        amount,
        payout_method: withdrawForm.method,
        payout_account: withdrawForm.phone,
      })
      toast.success('Demande de retrait envoyée !')
      setShowWithdrawModal(false)
      setWithdrawForm({ amount: '', method: 'wave', phone: '' })
      setWithdrawQuote(null)
      loadData()
    } catch (err) {
      toast.error(err.message || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const handleKycUpload = async (type, file) => {
    if (!file) return
    setUploading(type)
    try {
      await api.uploadKycDocument(type, file)
      toast.success('Document uploadé')
      loadData()
    } catch (err) {
      toast.error(err.message || 'Erreur upload')
    } finally {
      setUploading(null)
    }
  }

  const canWithdraw = kycStatus?.can_withdraw

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const pendingWithdrawals = withdrawals.filter(w => ['pending', 'processing'].includes(w.status))
  const pendingTotal = pendingWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0)
  const availableBalance = (wallet?.balance || 0) - pendingTotal

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Portefeuille</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gérez vos revenus et demandez des retraits</p>
      </div>

      {/* KYC Alert */}
      {!canWithdraw && (
        <div className="card p-4 bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800">Vérification d'identité requise</h3>
              <p className="text-sm text-amber-700 mt-1">
                Pour effectuer des retraits, vous devez soumettre vos documents KYC (pièce d'identité + justificatif de domicile).
              </p>
              <button
                onClick={() => setShowKycModal(true)}
                className="mt-3 text-sm font-medium text-amber-800 hover:text-amber-900 underline"
              >
                Soumettre mes documents
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KYC Status Badge */}
      {kycStatus && (
        <div className="flex items-center gap-2">
          <Shield size={16} className={kycStatus.kyc_status === 'approved' ? 'text-green-600' : 'text-gray-400'} />
          <span className={`text-sm font-medium ${
            kycStatus.kyc_status === 'approved' ? 'text-green-600' :
            kycStatus.kyc_status === 'pending' ? 'text-amber-600' :
            kycStatus.kyc_status === 'rejected' ? 'text-red-600' : 'text-gray-500'
          }`}>
            KYC: {
              kycStatus.kyc_status === 'approved' ? 'Validé' :
              kycStatus.kyc_status === 'pending' ? 'En attente de validation' :
              kycStatus.kyc_status === 'rejected' ? 'Rejeté' : 'Non soumis'
            }
          </span>
          {kycStatus.kyc_status !== 'approved' && (
            <button onClick={() => setShowKycModal(true)} className="text-xs text-blue-600 hover:underline">
              {kycStatus.kyc_status === 'none' ? 'Soumettre' : 'Voir détails'}
            </button>
          )}
        </div>
      )}

      {/* Balance card */}
      <div className="card p-6 text-white" style={{ background: '#3768AF' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>Solde disponible</p>
            <p className="text-4xl font-bold mt-1">{formatAmount(availableBalance)}</p>
            {pendingTotal > 0 && (
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {formatAmount(pendingTotal)} en attente de retrait
              </p>
            )}
          </div>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <Wallet size={32} />
          </div>
        </div>
        <button
          onClick={() => canWithdraw ? setShowWithdrawModal(true) : setShowKycModal(true)}
          disabled={availableBalance < 1000}
          className="mt-6 w-full font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'white', color: '#3768AF' }}
        >
          {canWithdraw ? (
            <>
              <Send size={18} />
              Demander un retrait
            </>
          ) : (
            <>
              <Shield size={18} />
              Valider mon identité
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <ArrowDownLeft size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatAmount(wallet?.total_credits || 0)}</p>
              <p className="text-xs text-gray-500">Total reçu</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <ArrowUpRight size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatAmount(wallet?.total_debits || 0)}</p>
              <p className="text-xs text-gray-500">Total retiré</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending withdrawals */}
      {pendingWithdrawals.length > 0 && (
        <div className="card p-4 bg-amber-50 border border-amber-200">
          <h3 className="font-semibold text-amber-800 flex items-center gap-2">
            <Clock size={18} />
            Retraits en cours
          </h3>
          <div className="mt-3 space-y-2">
            {pendingWithdrawals.map(w => (
              <div key={w.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                <div>
                  <p className="font-medium">{formatAmount(w.amount)}</p>
                  <p className="text-xs text-gray-500">{w.payout_method} - {w.payout_account}</p>
                </div>
                <span className={`text-xs font-medium ${w.status === 'processing' ? 'text-blue-600' : 'text-amber-600'}`}>
                  {w.status === 'processing' ? 'En transfert' : 'En attente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="card">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Historique des transactions</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Aucune transaction</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {tx.type === 'credit' ? (
                      <ArrowDownLeft size={20} className="text-green-600" />
                    ) : (
                      <ArrowUpRight size={20} className="text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{tx.description || (tx.type === 'credit' ? 'Paiement reçu' : 'Retrait')}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <p className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'credit' ? '+' : '-'}{formatAmount(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawal history */}
      {withdrawals.filter(w => w.status === 'completed' || w.status === 'rejected').length > 0 && (
        <div className="card">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Historique des retraits</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {withdrawals.filter(w => w.status === 'completed' || w.status === 'rejected').map((w) => (
              <div key={w.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    w.status === 'completed' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {w.status === 'completed' ? (
                      <CheckCircle size={20} className="text-green-600" />
                    ) : (
                      <XCircle size={20} className="text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{formatAmount(w.amount)}</p>
                    <p className="text-xs text-gray-500">{w.payout_method} - {w.payout_account}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium ${w.status === 'completed' ? 'text-green-600' : 'text-red-600'}`}>
                    {w.status === 'completed' ? 'Effectué' : 'Rejeté'}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {w.processed_at && new Date(w.processed_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Withdrawal modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Demander un retrait</h2>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="50000"
                  min="1000"
                  max={availableBalance}
                  value={withdrawForm.amount}
                  onChange={e => { setWithdrawQuote(null); setWithdrawForm({ ...withdrawForm, amount: e.target.value }) }}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Disponible: {formatAmount(availableBalance)} (min: 1 000 FCFA)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Méthode de retrait</label>
                <select
                  className="input"
                  value={withdrawForm.method}
                  onChange={e => { setWithdrawQuote(null); setWithdrawForm({ ...withdrawForm, method: e.target.value }) }}
                >
                  <option value="wave">Wave</option>
                  <option value="orange_money">Orange Money</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="77 123 45 67"
                  value={withdrawForm.phone}
                  onChange={e => setWithdrawForm({ ...withdrawForm, phone: e.target.value })}
                  required
                />
              </div>
              {withdrawQuote && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">
                  <p className="font-semibold text-blue-950">Récapitulatif DexPay</p>
                  <div className="mt-2 space-y-1 text-blue-900">
                    <p className="flex justify-between"><span>Montant demandé</span><strong>{formatAmount(withdrawQuote.gross_amount)}</strong></p>
                    <p className="flex justify-between"><span>Frais DexPay estimés</span><strong>-{formatAmount(withdrawQuote.estimated_fee)}</strong></p>
                    <p className="flex justify-between border-t border-blue-200 pt-2 font-semibold"><span>Vous recevrez estimativement</span><strong>{formatAmount(withdrawQuote.estimated_net_amount)}</strong></p>
                  </div>
                  <p className="mt-2 text-xs text-blue-700">Le montant final est celui confirmé par DexPay au traitement.</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setWithdrawQuote(null); setShowWithdrawModal(false) }} className="btn btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {submitting ? 'Envoi...' : withdrawQuote ? 'Confirmer le retrait' : 'Voir les frais DexPay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KYC modal */}
      {showKycModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Vérification d'identité (KYC)</h2>
            <p className="text-sm text-gray-500 mb-5">
              Pour effectuer des retraits, nous devons vérifier votre identité. Uploadez une pièce d'identité valide et un justificatif de domicile.
            </p>

            <div className="space-y-4">
              {/* Identity document */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={24} className="text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Pièce d'identité</p>
                      <p className="text-xs text-gray-500">CNI, Passeport ou Permis de conduire</p>
                    </div>
                  </div>
                  {kycStatus?.documents?.identity ? (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      kycStatus.documents.identity.status === 'approved' ? 'bg-green-100 text-green-700' :
                      kycStatus.documents.identity.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {kycStatus.documents.identity.status === 'approved' ? 'Validé' :
                       kycStatus.documents.identity.status === 'rejected' ? 'Rejeté' : 'En attente'}
                    </span>
                  ) : null}
                </div>
                {kycStatus?.documents?.identity?.status === 'rejected' && (
                  <p className="text-xs text-red-600 mt-2">{kycStatus.documents.identity.rejection_reason}</p>
                )}
                <input
                  ref={identityInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={e => handleKycUpload('identity', e.target.files[0])}
                />
                <button
                  onClick={() => identityInputRef.current?.click()}
                  disabled={uploading === 'identity' || kycStatus?.documents?.identity?.status === 'approved'}
                  className="mt-3 w-full btn btn-secondary text-sm flex items-center justify-center gap-2"
                >
                  {uploading === 'identity' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {kycStatus?.documents?.identity ? 'Remplacer' : 'Uploader'}
                </button>
              </div>

              {/* Address proof */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={24} className="text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Justificatif de domicile</p>
                      <p className="text-xs text-gray-500">Facture ou attestation récente (-3 mois)</p>
                    </div>
                  </div>
                  {kycStatus?.documents?.address_proof ? (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      kycStatus.documents.address_proof.status === 'approved' ? 'bg-green-100 text-green-700' :
                      kycStatus.documents.address_proof.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {kycStatus.documents.address_proof.status === 'approved' ? 'Validé' :
                       kycStatus.documents.address_proof.status === 'rejected' ? 'Rejeté' : 'En attente'}
                    </span>
                  ) : null}
                </div>
                {kycStatus?.documents?.address_proof?.status === 'rejected' && (
                  <p className="text-xs text-red-600 mt-2">{kycStatus.documents.address_proof.rejection_reason}</p>
                )}
                <input
                  ref={addressInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={e => handleKycUpload('address_proof', e.target.files[0])}
                />
                <button
                  onClick={() => addressInputRef.current?.click()}
                  disabled={uploading === 'address_proof' || kycStatus?.documents?.address_proof?.status === 'approved'}
                  className="mt-3 w-full btn btn-secondary text-sm flex items-center justify-center gap-2"
                >
                  {uploading === 'address_proof' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {kycStatus?.documents?.address_proof ? 'Remplacer' : 'Uploader'}
                </button>
              </div>
            </div>

            <button onClick={() => setShowKycModal(false)} className="mt-6 w-full btn btn-primary">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
