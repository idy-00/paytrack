import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import { useAuthStore } from '@/store/authStore'
import { MOCK_USERS } from '@/lib/mockData'

// ── Left panel features list ────────────────────────────────────────
const FEATURE_LIST = [
  'QR Code unique par dossier de vente',
  'Reçus PDF envoyés automatiquement',
  'Wave, Orange Money, Free Money',
  'Rappels SMS et WhatsApp automatiques',
  'Dashboard vendeur en temps réel',
]

// ── Left panel (decorative, always fixed height) ────────────────────
function LeftPanel() {
  return (
    <div className="hidden lg:flex w-[45%] flex-shrink-0 flex-col justify-between p-12 relative overflow-hidden"
      style={{ background: '#0F2744' }}>
      {/* Dot grid overlay */}
      <div className="absolute inset-0 grid-dot-bg opacity-[0.04] pointer-events-none" />

      {/* Logo */}
      <div className="relative flex items-center gap-3">
        <Logo size={28} />
        <Link to="/" className="font-bold text-xl text-white">PayTrack</Link>
      </div>

      {/* Hero copy */}
      <div className="relative">
        <h1 className="text-4xl font-extrabold text-white leading-tight mb-5 tracking-tight">
          Chaque vente tracée.
          <br />
          <span className="text-blue-200">Chaque franc encaissé.</span>
        </h1>
        <p className="text-blue-200 text-base leading-relaxed mb-9 max-w-xs">
          QR Code par dossier, reçus PDF automatiques, rappels SMS et WhatsApp.
        </p>
        <ul className="space-y-3">
          {FEATURE_LIST.map(item => (
            <li key={item} className="flex items-center gap-3">
              <CheckCircle2 size={16} className="text-blue-400 flex-shrink-0" />
              <span className="text-sm text-blue-100">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Social proof avatars */}
      <div className="relative flex items-center gap-3">
        <div className="flex -space-x-2">
          {[
            { bg: '#16A34A', i: 'MD' },
            { bg: '#D97706', i: 'FA' },
            { bg: '#7C3AED', i: 'IK' },
            { bg: '#0EA5E9', i: 'RD' },
          ].map(({ bg, i }) => (
            <div key={i}
              className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-white font-bold"
              style={{ borderColor: '#0F2744', background: bg, fontSize: 10 }}>
              {i}
            </div>
          ))}
        </div>
        <p className="text-xs text-blue-300">+200 commerçants actifs</p>
      </div>
    </div>
  )
}

// ── Login form ──────────────────────────────────────────────────────
function LoginForm({ onForgot }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const navigate  = useNavigate()
  const location  = useLocation()
  const login     = useAuthStore(s => s.login)
  const from      = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async e => {
    e.preventDefault()
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.')
      return
    }
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 700))

    if (email === 'moussa@phoneshop-dakar.com' && password === 'demo1234') {
      login(MOCK_USERS.vendeur, 'mock-token-vendeur')
      navigate(from, { replace: true })
    } else if (email === 'aminata@gmail.com' && password === 'demo1234') {
      login(MOCK_USERS.client, 'mock-token-client')
      navigate('/client/dashboard', { replace: true })
    } else {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-ink mb-1">Bon retour</h2>
      <p className="text-sm text-muted mb-7">Connectez-vous à votre espace PayTrack</p>

      {/* Demo hint */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 mb-6 space-y-1">
        <p className="text-xs text-blue-700">
          <strong>Démo vendeur :</strong> moussa@phoneshop-dakar.com &middot; demo1234
        </p>
        <p className="text-xs text-blue-700">
          <strong>Démo client :</strong> aminata@gmail.com &middot; demo1234
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="login-email" className="block text-sm font-semibold text-ink mb-1.5">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input"
            placeholder="vous@email.com"
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="text-sm font-semibold text-ink">
              Mot de passe
            </label>
            <button type="button" onClick={onForgot}
              className="text-xs font-medium text-blue hover:underline bg-transparent border-0 cursor-pointer p-0">
              Mot de passe oublié ?
            </button>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input pr-11"
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-dim bg-transparent border-0 cursor-pointer p-0"
              tabIndex={-1}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Inline error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-danger bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
            <AlertCircle size={15} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="btn btn-primary w-full justify-center gap-2 mt-1" style={{ minHeight: 46 }}>
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Connexion…</>
            : <>Se connecter <ArrowRight size={16} /></>
          }
        </button>
      </form>

      <p className="text-sm text-muted text-center mt-6">
        Pas encore de compte ?{' '}
        <Link to="/register" className="font-semibold text-blue hover:underline">Créer un compte</Link>
      </p>
    </>
  )
}

// ── Forgot password form ────────────────────────────────────────────
function ForgotForm({ onBack }) {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center py-6 animate-scale-in">
        <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={28} className="text-success" />
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">Email envoyé !</h2>
        <p className="text-sm text-muted max-w-xs mx-auto mb-7">
          Si un compte existe pour <strong className="text-ink">{email}</strong>,
          vous recevrez un lien sous quelques minutes.
        </p>
        <button onClick={onBack}
          className="btn btn-secondary gap-2 mx-auto">
          <ArrowLeft size={15} /> Retour à la connexion
        </button>
      </div>
    )
  }

  return (
    <>
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-7 bg-transparent border-0 cursor-pointer p-0">
        <ArrowLeft size={15} /> Retour à la connexion
      </button>

      <h2 className="text-2xl font-bold text-ink mb-1">Mot de passe oublié</h2>
      <p className="text-sm text-muted mb-7">Saisissez votre email pour recevoir un lien de réinitialisation.</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-ink mb-1.5">Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className="input" placeholder="vous@email.com" />
        </div>
        <button type="submit" disabled={loading || !email}
          className="btn btn-primary w-full justify-center gap-2" style={{ minHeight: 46 }}>
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <>Envoyer le lien <ArrowRight size={16} /></>
          }
        </button>
      </form>
    </>
  )
}

// ── Tab switcher ────────────────────────────────────────────────────
function AuthTabs({ active }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl mb-8 bg-fog">
      <button
        className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all border-0 cursor-pointer"
        style={{
          background: active === 'login' ? 'white' : 'transparent',
          color: active === 'login' ? '#111827' : '#9CA3AF',
          boxShadow: active === 'login' ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
        }}>
        Connexion
      </button>
      <Link to="/register"
        className="flex-1 py-2 rounded-lg text-sm font-semibold text-center transition-all"
        style={{ color: '#9CA3AF' }}>
        Inscription
      </Link>
    </div>
  )
}

// ── LoginPage ───────────────────────────────────────────────────────
export default function LoginPage() {
  const [view, setView] = useState('login') // 'login' | 'forgot'

  return (
    <div className="h-dvh flex overflow-hidden bg-white">
      <LeftPanel />

      {/* Right panel — scrollable form area */}
      <div className="flex-1 overflow-y-auto bg-snow flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[400px] py-6 animate-fade-in">

          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <Logo size={28} />
            <span className="font-bold text-lg text-ink">PayTrack</span>
          </Link>

          {/* Tabs — hidden in forgot view */}
          {view !== 'forgot' && <AuthTabs active="login" />}

          {/* Views */}
          {view === 'login'  && <LoginForm onForgot={() => setView('forgot')} />}
          {view === 'forgot' && <ForgotForm onBack={() => setView('login')} />}
        </div>
      </div>
    </div>
  )
}
