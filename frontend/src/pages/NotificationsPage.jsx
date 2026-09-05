import { useEffect, useState } from 'react'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

function notificationText(item) {
  return item.data?.message || item.data?.body || item.data?.title || 'Nouvelle notification PayTrack'
}

export default function NotificationsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const response = await api.getNotifications()
      setItems(response.data || [])
    } catch (error) {
      toast.error(error.message || 'Impossible de charger les notifications')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  const unread = items.filter(item => !item.read_at).length
  const markAll = async () => {
    setUpdating(true)
    try {
      await api.markAllNotificationsRead()
      setItems(current => current.map(item => ({ ...item, read_at: item.read_at || new Date().toISOString() })))
    } catch (error) { toast.error(error.message || 'Mise à jour impossible')
    } finally { setUpdating(false) }
  }
  const markOne = async item => {
    if (item.read_at) return
    try {
      await api.markNotificationRead(item.id)
      setItems(current => current.map(row => row.id === item.id ? { ...row, read_at: new Date().toISOString() } : row))
    } catch (error) { toast.error(error.message || 'Mise à jour impossible') }
  }

  return <div className="max-w-3xl mx-auto space-y-6">
    <div className="flex items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold text-gray-900">Notifications</h1><p className="mt-1 text-sm text-gray-500">{unread ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'Vous êtes à jour.'}</p></div>
      <button className="btn btn-secondary gap-2" disabled={!unread || updating} onClick={markAll}>{updating ? <Loader2 size={16} className="animate-spin" /> : <CheckCheck size={16} />} Tout marquer comme lu</button>
    </div>
    {loading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div> : items.length === 0 ? <div className="card p-12 text-center"><Bell className="mx-auto text-gray-300" size={42}/><p className="mt-4 font-semibold text-gray-800">Aucune notification</p><p className="mt-1 text-sm text-gray-500">Les rappels de paiement et les mises à jour importantes apparaîtront ici.</p></div> : <div className="card divide-y divide-gray-100 overflow-hidden">{items.map(item => <button key={item.id} onClick={() => markOne(item)} className={`w-full p-5 text-left hover:bg-gray-50 ${item.read_at ? '' : 'bg-blue-50/70'}`}><div className="flex gap-3"><Bell size={18} className="mt-0.5 shrink-0 text-blue-700"/><div className="min-w-0"><p className="font-semibold text-gray-900">{item.data?.title || 'PayTrack'}</p><p className="mt-1 text-sm text-gray-600">{notificationText(item)}</p><p className="mt-2 text-xs text-gray-400">{item.created_at ? new Date(item.created_at).toLocaleString('fr-SN') : ''}</p></div>{!item.read_at && <span className="ml-auto mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" aria-label="Non lue"/>}</div></button>)}</div>}
  </div>
}
