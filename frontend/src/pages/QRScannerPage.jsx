import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { QrCode, Search, ArrowRight, CheckCircle2, AlertCircle, Hash, Camera, CameraOff } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import { formatAmount, getProgressPercent } from '@/lib/utils'
import { api } from '@/lib/api'
import StatusBadge from '@/components/ui/StatusBadge'
import ProgressBar from '@/components/ui/ProgressBar'

const BLUE = '#1D6FE8'
const SUCCESS = '#16A34A'

export default function QRScannerPage() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const navigate = useNavigate()
  const scannerRef = useRef(null)

  const lookup = async (code) => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const response = await api.getSales(`?search=${encodeURIComponent(code.trim())}`)
      const sales = response.data || response || []
      const found = sales.find(s => s.qr_uuid === code.trim() || s.reference?.toLowerCase() === code.trim().toLowerCase())
      if (found) {
        setResult(found)
      } else {
        setError('Aucun dossier trouvé pour ce QR Code ou cette référence.')
      }
    } catch {
      setError('Erreur lors de la recherche.')
    }
    setLoading(false)
  }

  const startScanner = async () => {
    setCameraError('')
    try {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => { lookup(decodedText); stopScanner() },
        () => {}
      )
      setScanning(true)
    } catch {
      setCameraError("Impossible d'accéder à la caméra.")
      setScanning(false)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); scannerRef.current.clear() } catch {}
      scannerRef.current = null
    }
    setScanning(false)
  }

  useEffect(() => { return () => { stopScanner() } }, [])

  const handleSearch = async e => { e?.preventDefault(); if (input.trim()) lookup(input) }

  const pct = result ? getProgressPercent(result.paid_amount, result.total_amount) : 0

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scanner un QR Code</h1>
        <p className="text-sm text-gray-500 mt-0.5">Scannez un QR Code ou saisissez une référence</p>
      </div>

      <div className="card p-6 text-center">
        <div id="qr-reader" style={{ width: '100%', maxWidth: 320, margin: '0 auto', borderRadius: 12, overflow: 'hidden' }} />
        {!scanning && (
          <div className="relative w-52 h-52 mx-auto mb-5">
            <div className="absolute inset-0 rounded-2xl bg-gray-50 border border-gray-200" />
            {[
              { className: 'top-0 left-0 border-t-2 border-l-2 rounded-tl-xl' },
              { className: 'top-0 right-0 border-t-2 border-r-2 rounded-tr-xl' },
              { className: 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl' },
              { className: 'bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl' },
            ].map((c, i) => <div key={i} className={`absolute w-7 h-7 ${c.className}`} style={{ borderColor: BLUE }} />)}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <QrCode size={38} style={{ color: `${BLUE}60` }} />
              <p className="text-xs text-gray-400 text-center px-4 leading-relaxed">Appuyez pour activer la caméra</p>
            </div>
          </div>
        )}
        {cameraError && <div className="flex items-center justify-center gap-2 mt-3 text-sm text-red-600"><AlertCircle size={14} />{cameraError}</div>}
        <button onClick={scanning ? stopScanner : startScanner} className="btn btn-primary gap-2 mt-4">
          {scanning ? <><CameraOff size={16} /> Arrêter</> : <><Camera size={16} /> Activer caméra</>}
        </button>
        <p className="text-xs text-gray-400 mt-3">Ou saisissez la référence ci-dessous</p>
      </div>

      <div className="card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4"><Hash size={15} style={{ color: BLUE }} />Recherche par référence</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="VT-2026-0001 ou UUID" className="input pl-10 font-mono" />
          </div>
          <button type="submit" disabled={loading || !input.trim()} className="btn btn-primary gap-2 flex-shrink-0">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Search size={14} /> Rechercher</>}
          </button>
        </form>
        {error && <div className="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5"><AlertCircle size={14} />{error}</div>}
      </div>

      {result && (
        <div className="card p-5 border-blue-200">
          <div className="flex items-center gap-2 mb-5" style={{ color: SUCCESS }}><CheckCircle2 size={18} /><span className="text-sm font-semibold">Dossier trouvé</span></div>
          <div className="divide-y divide-gray-100 mb-5">
            {[
              { label: 'Référence', value: result.reference, mono: true },
              { label: 'Client', value: result.client?.name },
              { label: 'Article', value: result.article?.name },
              { label: 'Total', value: formatAmount(result.total_amount), amount: true },
              { label: 'Payé', value: formatAmount(result.paid_amount), amount: true },
              { label: 'Restant', value: formatAmount(result.remaining_amount), amount: true },
            ].map(({ label, value, mono, amount: isAmount }) => (
              <div key={label} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-gray-500">{label}</span>
                <span className={`text-sm font-semibold text-gray-900 ${mono ? 'font-mono' : ''} ${isAmount ? 'amount' : ''}`}>{value || '—'}</span>
              </div>
            ))}
          </div>
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500">Progression</span>
              <div className="flex items-center gap-2"><StatusBadge status={result.status} /><span className="amount text-xs font-semibold text-gray-600">{pct}%</span></div>
            </div>
            <ProgressBar percent={pct} status={result.status} />
          </div>
          <Link to={`/ventes/${result.id}`} className="btn btn-primary w-full justify-center gap-2">Ouvrir le dossier <ArrowRight size={15} /></Link>
        </div>
      )}
    </div>
  )
}
