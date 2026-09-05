import { useState, useEffect } from 'react'
import { CreditCard, Check, Crown, Zap, Building2, Loader2, Clock, Receipt, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'
import { formatAmount } from '@/lib/utils'
import toast from 'react-hot-toast'

const PLAN_ICONS = {
  essentiel: Zap,
  pro: Crown,
  business: Building2,
}

const PLAN_COLORS = {
  essentiel: 'blue',
  pro: 'purple',
  business: 'amber',
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [changingPlan, setChangingPlan] = useState(false)
  const [billingCycle, setBillingCycle] = useState('monthly')

  const BILLING_OPTIONS = [
    { key: 'daily', label: 'Jour' },
    { key: 'weekly', label: 'Semaine' },
    { key: 'monthly', label: 'Mois' },
    { key: 'quarterly', label: '3 mois', discount: '-8%' },
    { key: 'yearly', label: 'An', discount: '-17%', bonus: '1 mois offert' },
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [plansRes, subRes, invRes] = await Promise.all([
        api.getPlans(),
        api.getSubscription(),
        api.getInvoices(),
      ])
      setPlans(plansRes || [])
      setSubscription(subRes?.subscription || null)
      setInvoices(invRes?.data || [])
    } catch (err) {
      toast.error('Erreur chargement données')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePlan = async (planId) => {
    setChangingPlan(true)
    try {
      await api.changePlan(planId, billingCycle)
      toast.success('Plan modifié !')
      loadData()
    } catch (err) {
      toast.error(err.message || 'Erreur')
    } finally {
      setChangingPlan(false)
    }
  }

  const handlePayInvoice = async (invoiceId) => {
    try {
      const res = await api.payInvoice(invoiceId)
      if (res.payment_url) {
        window.location.href = res.payment_url
      } else {
        toast.error('Paiement en ligne non disponible')
      }
    } catch (err) {
      toast.error(err.message || 'Erreur paiement')
    }
  }

  const handleAssistedSetup = async () => {
    try {
      await api.requestAssistedSetup()
      toast.success('Demande envoyée ! ATAABA vous contactera sous 24h.')
    } catch (err) {
      toast.error(err.message || 'Erreur')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const currentPlan = subscription?.plan
  const daysLeft = subscription ? Math.max(0, Math.ceil((new Date(subscription.ends_at) - new Date()) / 86400000)) : 0
  const isTrial = subscription?.status === 'trial'
  const isExpired = subscription?.status === 'expired' || subscription?.status === 'suspended'

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Abonnement</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gérez votre plan et vos factures</p>
      </div>

      {/* Current subscription status */}
      {subscription && (
        <div className={`card p-5 border-l-4 ${isExpired ? 'border-l-red-500 bg-red-50' : isTrial ? 'border-l-amber-500 bg-amber-50' : 'border-l-green-500 bg-green-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isExpired ? (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              ) : (
                <Clock className="w-8 h-8 text-amber-600" />
              )}
              <div>
                <p className="font-semibold text-gray-900">
                  {isExpired ? 'Abonnement expiré' : isTrial ? 'Période d\'essai' : `Plan ${currentPlan?.name}`}
                </p>
                <p className="text-sm text-gray-600">
                  {isExpired ? 'Renouvelez pour continuer' : `${daysLeft} jours restants`}
                </p>
              </div>
            </div>
            {!subscription.assisted_setup_requested && (
              <button onClick={handleAssistedSetup} className="btn btn-secondary text-sm">
                Configuration assistée (10 000 FCFA)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Billing cycle toggle */}
      <div className="flex justify-center">
        <div className="inline-flex flex-wrap justify-center bg-gray-100 rounded-xl p-1 gap-1">
          {BILLING_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setBillingCycle(opt.key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${billingCycle === opt.key ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
            >
              {opt.label}
              {opt.discount && <span className="text-green-600 text-xs ml-1">{opt.discount}</span>}
            </button>
          ))}
        </div>
      </div>
      {billingCycle === 'yearly' && (
        <p className="text-center text-sm text-green-600 font-medium">Offre de lancement : 1 mois gratuit sur l'abonnement annuel</p>
      )}

      {/* Plans grid */}
      <div className="grid md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const Icon = PLAN_ICONS[plan.slug] || Zap
          const color = PLAN_COLORS[plan.slug] || 'blue'
          const priceKey = `price_${billingCycle}`
          const price = plan[priceKey] || plan.price_monthly
          const isCurrent = currentPlan?.id === plan.id

          return (
            <div key={plan.id} className={`card p-6 relative ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}>
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Plan actuel
                </span>
              )}

              <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 text-${color}-600`} />
              </div>

              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold text-gray-900">{formatAmount(price)}</span>
                <span className="text-gray-500">/{BILLING_OPTIONS.find(o => o.key === billingCycle)?.label.toLowerCase()}</span>
              </div>

              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-green-500" />
                  {plan.max_products ? `${plan.max_products} produits` : 'Produits illimités'}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-green-500" />
                  {plan.max_users} utilisateur{plan.max_users > 1 ? 's' : ''}
                </li>
                {plan.advanced_stock && (
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={16} className="text-green-500" />
                    Stock avancé & inventaires
                  </li>
                )}
                {plan.supplier_orders && (
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={16} className="text-green-500" />
                    Gestion fournisseurs
                  </li>
                )}
                {plan.multi_shop && (
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={16} className="text-green-500" />
                    Multi-boutiques
                  </li>
                )}
              </ul>

              <button
                onClick={() => handleChangePlan(plan.id)}
                disabled={isCurrent || changingPlan}
                className={`w-full btn ${isCurrent ? 'btn-secondary' : 'btn-primary'}`}
              >
                {changingPlan ? <Loader2 size={16} className="animate-spin" /> : isCurrent ? 'Plan actuel' : 'Choisir ce plan'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Invoices */}
      <div className="card">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Receipt size={20} />
            Factures
          </h2>
        </div>
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Aucune facture</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left">N° Facture</th>
                <th className="table-header text-left">Date</th>
                <th className="table-header text-left">Montant</th>
                <th className="table-header text-left">Statut</th>
                <th className="table-header text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="table-row">
                  <td className="table-cell font-medium">{inv.invoice_number}</td>
                  <td className="table-cell text-gray-600">{new Date(inv.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="table-cell font-medium">{formatAmount(inv.amount)}</td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                      inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {inv.status === 'paid' ? 'Payée' : 'En attente'}
                    </span>
                  </td>
                  <td className="table-cell">
                    {inv.status !== 'paid' && (
                      <button onClick={() => handlePayInvoice(inv.id)} className="btn btn-primary btn-sm">
                        Payer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
