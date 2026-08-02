import { useState, useEffect } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflineScreen() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = async () => {
    setChecking(true)
    try {
      await fetch('/api/health', { method: 'HEAD', cache: 'no-store' })
      setIsOffline(false)
    } catch {
      setIsOffline(true)
    } finally {
      setChecking(false)
    }
  }

  if (!isOffline) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6" style={{ background: '#F7F5F0' }}>
      <div className="text-center max-w-sm animate-fade-in">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6" style={{ background: '#FEE2E2' }}>
          <WifiOff size={36} className="text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pas de connexion</h1>
        <p className="text-gray-500 mb-8">
          Vérifiez votre connexion internet et réessayez. Vos données seront synchronisées automatiquement.
        </p>

        <button
          onClick={handleRetry}
          disabled={checking}
          className="btn btn-primary gap-2 mx-auto"
        >
          {checking ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Vérification...
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Réessayer
            </>
          )}
        </button>

        <div className="mt-8 p-4 rounded-xl" style={{ background: '#EEF4FE', border: '1px solid #DBEAFE' }}>
          <p className="text-xs text-blue-700">
            <strong>Astuce :</strong> En mode hors ligne, vous pouvez consulter vos données en cache mais pas créer de nouvelles transactions.
          </p>
        </div>
      </div>
    </div>
  )
}
