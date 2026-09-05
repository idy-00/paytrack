import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

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
      } else if (user.role === 'admin_entreprise' || user.role === 'super_admin') {
        navigate('/admin', { replace: true })
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
              style={{ color: '#3768AF' }}>
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

      {/* Social Login Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-white text-gray-400">ou continuer avec</span>
        </div>
      </div>

      {/* Social Login Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => window.location.href = '/api/auth/google'}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-sm font-medium text-gray-700">Google</span>
        </button>
        <button
          type="button"
          onClick={() => window.location.href = '/api/auth/apple'}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          <span className="text-sm font-medium text-gray-700">Apple</span>
        </button>
      </div>

      <p className="text-sm text-center mt-6" style={{ color: '#6B7280' }}>
        Pas encore de compte ?{' '}
        <Link to="/register" className="font-semibold hover:underline" style={{ color: '#3768AF' }}>Créer un compte</Link>
      </p>
    </>
  )
}

// ── Forgot password form ────────────────────────────────────────────
function ForgotForm({ onBack }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [step, setStep] = useState('email')
  const [resetToken, setResetToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (step === 'email') {
        await api.sendOtp(email, 'password_reset')
        setStep('code')
      } else if (step === 'code') {
        const response = await api.verifyOtp(email, code, 'password_reset')
        setResetToken(response.reset_token)
        setStep('password')
      } else {
        if (password !== passwordConfirmation) {
          setError('Les mots de passe ne correspondent pas.')
          return
        }
        await api.resetPasswordWithOtp(resetToken, password, passwordConfirmation)
        setStep('done')
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="text-center py-6 animate-scale-in">
        <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={28} className="text-success" />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Mot de passe mis à jour</h2>
        <p className="text-sm max-w-xs mx-auto mb-7" style={{ color: '#6B7280' }}>
          Votre mot de passe a été changé. Vous pouvez maintenant vous connecter.
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
      <p className="text-sm mb-7" style={{ color: '#6B7280' }}>
        {step === 'email' && 'Saisissez votre email pour recevoir un code de réinitialisation.'}
        {step === 'code' && `Saisissez le code à 6 chiffres envoyé à ${email}.`}
        {step === 'password' && 'Choisissez un nouveau mot de passe sécurisé.'}
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {step === 'email' && <div>
          <label htmlFor="forgot-email" className="block text-sm font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>Email</label>
          <input id="forgot-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className="input" placeholder="vous@email.com" />
        </div>}
        {step === 'code' && <div>
          <label htmlFor="forgot-code" className="block text-sm font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>Code de vérification</label>
          <input id="forgot-code" inputMode="numeric" autoComplete="one-time-code" maxLength="6" required value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))} className="input tracking-[0.45em]" placeholder="123456" />
        </div>}
        {step === 'password' && <>
          <div>
            <label htmlFor="forgot-password" className="block text-sm font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>Nouveau mot de passe</label>
            <input id="forgot-password" type="password" autoComplete="new-password" minLength="8" required value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder="8 caractères minimum" />
          </div>
          <div>
            <label htmlFor="forgot-password-confirmation" className="block text-sm font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>Confirmer le mot de passe</label>
            <input id="forgot-password-confirmation" type="password" autoComplete="new-password" minLength="8" required value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)} className="input" placeholder="Répétez le mot de passe" />
          </div>
        </>}
        {error && <p className="flex gap-2 text-sm text-red-600"><AlertCircle size={16} className="shrink-0 mt-0.5" />{error}</p>}
        <button type="submit" disabled={loading || (step === 'email' && !email) || (step === 'code' && code.length !== 6) || (step === 'password' && (!password || !passwordConfirmation))}
          className="btn btn-primary w-full justify-center gap-2" style={{ minHeight: 46 }}>
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <>{step === 'email' ? 'Envoyer le code' : step === 'code' ? 'Vérifier le code' : 'Enregistrer le mot de passe'} <ArrowRight size={16} /></>
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
