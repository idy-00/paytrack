import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { formatAmount, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ClientSaleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [sale, setSale] = useState(null)
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    api.getSale(id).then(setSale).catch(() => setSale(null)).finally(() => setLoading(false))
  }, [id])

  const pay = async () => {
    const value = Number(amount) || sale?.installment_amount || sale?.remaining_amount || 0
    if (value < 1 || value > sale.remaining_amount) return toast.error('Montant invalide')
    if (!/^\+?[0-9]{8,15}$/.test(phone.replaceAll(' ', ''))) return toast.error('Saisissez votre numéro Mobile Money')
    setPaying(true)
    try {
      const response = await api.initiateMobilePayment(sale.id, { gateway: 'dexpay', amount: value, phone: phone.replaceAll(' ', '') })
      if (!response.checkout_url) throw new Error('Lien de paiement indisponible')
      window.location.assign(response.checkout_url)
    } catch (error) {
      toast.error(error.message || 'Impossible de démarrer le paiement')
    } finally { setPaying(false) }
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
  if (!sale) return <div className="py-20 text-center"><p>Dossier introuvable.</p><button className="btn btn-secondary mt-4" onClick={() => navigate('/client/dashboard')}>Retour</button></div>

  const schedule = sale.schedule || sale.schedules || []
  const due = schedule.find(item => item.status !== 'paye')
  return <div className="max-w-2xl mx-auto space-y-5 pb-8">
    <button className="btn btn-ghost -ml-2 gap-2" onClick={() => navigate('/client/dashboard')}><ArrowLeft size={16}/> Mes dossiers</button>
    <section className="card p-6">
      <p className="text-xs font-mono text-muted">{sale.reference}</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">{sale.article?.name || 'Votre achat'}</h1>
      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-fog p-3"><p className="text-xs text-muted">Total</p><p className="amount font-bold">{formatAmount(sale.total_amount)}</p></div>
        <div className="rounded-xl bg-fog p-3"><p className="text-xs text-muted">Payé</p><p className="amount font-bold">{formatAmount(sale.paid_amount)}</p></div>
        <div className="rounded-xl bg-blue/10 p-3"><p className="text-xs text-muted">Restant</p><p className="amount font-bold text-blue">{formatAmount(sale.remaining_amount)}</p></div>
      </div>
      {due && <p className="mt-5 text-sm text-muted">Prochaine échéance : <strong className="text-ink">{formatAmount(due.amount)}</strong> le {formatDate(due.due_date)}</p>}
    </section>
    {sale.status !== 'solde' && <section className="card p-6">
      <h2 className="text-lg font-bold text-ink">Payer mon échéance</h2>
      <p className="mt-1 text-sm text-muted">Vous paierez uniquement le montant ci-dessous. Aucun frais ne vous est ajouté.</p>
      <label htmlFor="client-payment-amount" className="block mt-5 text-sm font-medium">Montant à payer</label>
      <input id="client-payment-amount" className="input mt-1" type="number" min="1" max={sale.remaining_amount} value={amount} placeholder={String(due?.amount || sale.remaining_amount)} onChange={e => setAmount(e.target.value)} />
      <label htmlFor="client-payment-phone" className="block mt-4 text-sm font-medium">Numéro Mobile Money</label>
      <input id="client-payment-phone" className="input mt-1" inputMode="tel" value={phone} placeholder="77 123 45 67" onChange={e => setPhone(e.target.value)} />
      <button className="btn btn-primary mt-5 w-full gap-2" disabled={paying} onClick={pay}>{paying ? <Loader2 size={16} className="animate-spin"/> : <CreditCard size={16}/>} Payer {formatAmount(Number(amount) || due?.amount || sale.remaining_amount)}</button>
      <p className="mt-3 text-xs text-muted">La confirmation du paiement arrive après validation sécurisée par DexPay.</p>
    </section>}
  </div>
}
