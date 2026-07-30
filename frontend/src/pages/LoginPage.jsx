import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import { useAuthStore } from '@/store/authStore'

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

    try {
      const user = await login(email, password)
      if (user.role === 'client') {
        navigate('/client/dashboard', { replace: true })
      } else {
        navigate(from, { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Email ou mot de passe incorrect.')
      setLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-2xl font-bold mb-1" style={{ color: '#1A1A1A' }}>Bon retour</h2>
      <p className="text-sm mb-7" style={{ color: '#6B7280' }}>Connectez-vous à votre espace PayTrack</p>

      {/* Demo hint */}
      <div className="rounded-xl p-3.5 mb-6 space-y-1"
        style={{ background: '#EEF4FE', border: '1px solid #DBEAFE' }}>
        <p className="text-xs" style={{ color: '#1D6FE8' }}>
          <strong>Démo vendeur :</strong> moussa@phoneshop-dakar.com &middot; demo1234
        </p>
        <p className="text-xs" style={{ color: '#1D6FE8' }}>
          <strong>Démo client :</strong> aminata@gmail.com &middot; demo1234
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="login-email" className="block text-sm font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>
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
            <label htmlFor="login-password" className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>
              Mot de passe
            </label>
            <button type="button" onClick={onForgot}
              className="text-xs font-medium hover:underline bg-transparent border-0 cursor-pointer p-0"
              style={{ color: '#1D6FE8' }}>
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
              className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:text-dim bg-transparent border-0 cursor-pointer p-0"
              style={{ color: '#6B7280' }}
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

      <p className="text-sm text-center mt-6" style={{ color: '#6B7280' }}>
        Pas encore de compte ?{' '}
        <Link to="/register" className="font-semibold hover:underline" style={{ color: '#1D6FE8' }}>Créer un compte</Link>
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
        <h2 className="text-xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Email envoyé !</h2>
        <p className="text-sm max-w-xs mx-auto mb-7" style={{ color: '#6B7280' }}>
          Si un compte existe pour <strong style={{ color: '#1A1A1A' }}>{email}</strong>,
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
        className="flex items-center gap-1.5 text-sm mb-7 bg-transparent border-0 cursor-pointer p-0 hover:underline"
        style={{ color: '#6B7280' }}>
        <ArrowLeft size={15} /> Retour à la connexion
      </button>

      <h2 className="text-2xl font-bold mb-1" style={{ color: '#1A1A1A' }}>Mot de passe oublié</h2>
      <p className="text-sm mb-7" style={{ color: '#6B7280' }}>Saisissez votre email pour recevoir un lien de réinitialisation.</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>Email</label>
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
    <div className="flex gap-1 p-1 rounded-xl mb-8" style={{ background: '#F7F5F0' }}>
      <button
        className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all border-0 cursor-pointer"
        style={{
          background: active === 'login' ? 'white' : 'transparent',
          color: active === 'login' ? '#1A1A1A' : '#9CA3AF',
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
    <div className="min-h-dvh flex items-center justify-center p-6" style={{ background: '#F7F5F0' }}>
      <div className="w-full max-w-[420px] animate-fade-in">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <Logo size={30} />
          <span className="font-bold text-xl" style={{ color: '#1A1A1A' }}>PayTrack</span>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl p-10" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #E8E4DD' }}>
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
