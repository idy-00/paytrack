import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Plus, Minus, Trash2, ShoppingCart, Loader2, User } from 'lucide-react'
import { api } from '@/lib/api'
import { formatAmount } from '@/lib/utils'
import toast from 'react-hot-toast'
import Modal from '@/components/ui/Modal'

export default function NewOrderPage() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedClient, setSelectedClient] = useState(null)
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)

  const [cart, setCart] = useState([])
  const [articleSearch, setArticleSearch] = useState('')
  const [paymentMode, setPaymentMode] = useState('comptant')
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [showNewClient, setShowNewClient] = useState(false)
  const [showNewArticle, setShowNewArticle] = useState(false)
  const [quickClient, setQuickClient] = useState({ full_name: '', phone: '' })
  const [quickArticle, setQuickArticle] = useState({ name: '', price: '', stock: '0' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [clientsRes, articlesRes] = await Promise.all([
        api.getClients(),
        api.getArticles(),
      ])
      setClients(clientsRes?.data || clientsRes || [])
      setArticles(articlesRes?.data || articlesRes || [])
    } catch (err) {
      toast.error('Erreur chargement')
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(c =>
    c.full_name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone?.includes(clientSearch)
  )

  const filteredArticles = articles.filter(a =>
    a.name?.toLowerCase().includes(articleSearch.toLowerCase())
  )

  const addToCart = (article) => {
    const existing = cart.find(item => item.article_id === article.id)
    if (existing) {
      setCart(cart.map(item =>
        item.article_id === article.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, {
        article_id: article.id,
        name: article.name,
        unit_price: article.price,
        quantity: 1,
        discount: 0,
        stock: article.stock,
      }])
    }
  }

  const updateQuantity = (articleId, delta) => {
    setCart(cart.map(item => {
      if (item.article_id === articleId) {
        const newQty = Math.max(1, Math.min(item.stock || 999, item.quantity + delta))
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }

  const removeFromCart = (articleId) => {
    setCart(cart.filter(item => item.article_id !== articleId))
  }

  const createQuickClient = async () => {
    if (!quickClient.full_name.trim()) return toast.error('Le nom du client est requis.')
    try {
      const client = await api.createClient({ full_name: quickClient.full_name.trim(), phone: quickClient.phone.trim() })
      setClients(items => [...items, client])
      setSelectedClient(client)
      setShowNewClient(false)
      setQuickClient({ full_name: '', phone: '' })
      toast.success('Client créé et sélectionné')
    } catch (err) { toast.error(err.message || 'Impossible de créer le client') }
  }

  const createQuickArticle = async () => {
    const price = Number(quickArticle.price)
    if (!quickArticle.name.trim() || !Number.isFinite(price) || price < 0) return toast.error('Saisissez un article et un prix valide.')
    try {
      const article = await api.createArticle({ name: quickArticle.name.trim(), price, stock: Number(quickArticle.stock) || 0 })
      setArticles(items => [...items, article])
      addToCart(article)
      setShowNewArticle(false)
      setQuickArticle({ name: '', price: '', stock: '0' })
      toast.success('Article créé et ajouté au panier')
    } catch (err) { toast.error(err.message || 'Impossible de créer l’article') }
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
  const total = Math.max(0, subtotal - discount)

  const handleSubmit = async () => {
    if (!selectedClient) {
      toast.error('Sélectionnez un client')
      return
    }
    if (cart.length === 0) {
      toast.error('Ajoutez au moins un article')
      return
    }

    setSubmitting(true)
    try {
      const res = await api.createOrder({
        client_id: selectedClient.id,
        payment_mode: paymentMode,
        discount,
        notes,
        items: cart.map(item => ({
          article_id: item.article_id,
          quantity: item.quantity,
          discount: item.discount || 0,
        })),
      })
      toast.success('Commande créée !')
      navigate(`/commandes/${res.order?.id || res.id}`)
    } catch (err) {
      toast.error(err.message || 'Erreur création')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/commandes')} className="btn btn-ghost btn-icon">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle commande</h1>
          <p className="text-sm text-gray-500">Créez une commande pour un client</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Client & Articles */}
        <div className="lg:col-span-2 space-y-5">
          {/* Client selection */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-gray-900 flex items-center gap-2"><User size={18} />Client</h3><button type="button" onClick={() => setShowNewClient(true)} className="text-sm font-semibold text-green-700 inline-flex items-center gap-1"><Plus size={15} /> Ajouter</button></div>

            {selectedClient ? (
              <div className="flex items-center justify-between bg-blue-50 p-3 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">{selectedClient.full_name}</p>
                  <p className="text-sm text-gray-500">{selectedClient.phone}</p>
                </div>
                <button onClick={() => setSelectedClient(null)} className="btn btn-ghost btn-sm text-red-600">
                  Changer
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un client..."
                  value={clientSearch}
                  onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true) }}
                  onFocus={() => setShowClientDropdown(true)}
                  className="input pl-10"
                />
                {showClientDropdown && clientSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredClients.length === 0 ? (
                      <div className="p-3 text-gray-400 text-sm">Aucun client trouvé</div>
                    ) : (
                      filteredClients.slice(0, 5).map(client => (
                        <button
                          key={client.id}
                          onClick={() => { setSelectedClient(client); setShowClientDropdown(false); setClientSearch('') }}
                          className="w-full p-3 text-left hover:bg-gray-50 flex items-center justify-between"
                        >
                          <span className="font-medium">{client.full_name}</span>
                          <span className="text-sm text-gray-500">{client.phone}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Articles */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-gray-900">Articles</h3><button type="button" onClick={() => setShowNewArticle(true)} className="text-sm font-semibold text-green-700 inline-flex items-center gap-1"><Plus size={15} /> Ajouter</button></div>
            <div className="relative mb-4">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un article..."
                value={articleSearch}
                onChange={e => setArticleSearch(e.target.value)}
                className="input pl-10"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
              {filteredArticles.map(article => {
                const inCart = cart.find(item => item.article_id === article.id)
                const outOfStock = article.track_stock && (article.stock || 0) <= 0

                return (
                  <button
                    key={article.id}
                    onClick={() => !outOfStock && addToCart(article)}
                    disabled={outOfStock}
                    className={`p-3 rounded-xl text-left transition-all ${inCart ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'} ${outOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <p className="font-medium text-gray-900 text-sm truncate">{article.name}</p>
                    <p className="text-blue-600 font-bold text-sm">{formatAmount(article.price)}</p>
                    {article.track_stock && (
                      <p className={`text-xs mt-1 ${(article.stock || 0) <= 3 ? 'text-red-500' : 'text-gray-400'}`}>
                        Stock: {article.stock || 0}
                      </p>
                    )}
                    {inCart && (
                      <span className="inline-block mt-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                        x{inCart.quantity}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Cart */}
        <div className="space-y-5">
          <div className="card p-5 sticky top-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ShoppingCart size={18} />
              Panier ({cart.length})
            </h3>

            {cart.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Panier vide</p>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {cart.map(item => (
                  <div key={item.article_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{formatAmount(item.unit_price)} x {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQuantity(item.article_id, -1)} className="btn btn-ghost btn-icon btn-sm">
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.article_id, 1)} className="btn btn-ghost btn-icon btn-sm">
                        <Plus size={14} />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.article_id)} className="btn btn-ghost btn-icon btn-sm text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Options */}
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value)}
                  className="input"
                >
                  <option value="comptant">Comptant</option>
                  <option value="tranche">Par tranches</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remise (FCFA)</label>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount}
                  onChange={e => setDiscount(Math.min(subtotal, parseInt(e.target.value) || 0))}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Instructions spéciales..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sous-total</span>
                <span className="font-medium">{formatAmount(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Remise</span>
                  <span className="font-medium text-red-600">-{formatAmount(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-blue-600">{formatAmount(total)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!selectedClient || cart.length === 0 || submitting}
              className="w-full btn btn-primary mt-4 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
              {submitting ? 'Création...' : 'Créer la commande'}
            </button>
          </div>
        </div>
      </div>
      <Modal open={showNewClient} onClose={() => setShowNewClient(false)} title="Ajouter un client">
        <div className="space-y-4"><div><label className="block text-sm font-medium mb-1" htmlFor="quick-client-name">Nom complet *</label><input id="quick-client-name" className="input" value={quickClient.full_name} onChange={e => setQuickClient(v => ({ ...v, full_name: e.target.value }))} /></div><div><label className="block text-sm font-medium mb-1" htmlFor="quick-client-phone">Téléphone</label><input id="quick-client-phone" className="input" value={quickClient.phone} onChange={e => setQuickClient(v => ({ ...v, phone: e.target.value }))} /></div><button type="button" onClick={createQuickClient} className="btn btn-primary w-full">Créer et sélectionner</button></div>
      </Modal>
      <Modal open={showNewArticle} onClose={() => setShowNewArticle(false)} title="Ajouter un article">
        <div className="space-y-4"><div><label className="block text-sm font-medium mb-1" htmlFor="quick-article-name">Nom de l’article *</label><input id="quick-article-name" className="input" value={quickArticle.name} onChange={e => setQuickArticle(v => ({ ...v, name: e.target.value }))} /></div><div><label className="block text-sm font-medium mb-1" htmlFor="quick-article-price">Prix (FCFA) *</label><input id="quick-article-price" type="number" min="0" className="input" value={quickArticle.price} onChange={e => setQuickArticle(v => ({ ...v, price: e.target.value }))} /></div><button type="button" onClick={createQuickArticle} className="btn btn-primary w-full">Créer et ajouter au panier</button></div>
      </Modal>
    </div>
  )
}
