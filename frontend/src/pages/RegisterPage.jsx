import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import { useAuthStore } from '@/store/authStore'

function PasswordStrength({ password }) {
  if (!password) return null
  const checks = [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)]
  const score = checks.filter(Boolean).length
  const colors = ['', '#DC2626', '#D97706', '#0EA5E9', '#16A34A']
  const labels = ['', 'Faible', 'Moyen', 'Bon', 'Fort']
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full transition-colors duration-200"
            style={{ background: i <= score ? colors[score] : '#E8E4DD' }} />
        ))}
      </div>
      <span className="text-xs font-semibold w-8 text-right" style={{ color: colors[score] }}>{labels[score]}</span>
    </div>
  )
}

function Stepper({ step }) {
  const steps = ['Votre compte', 'Votre boutique']
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
            style={{ background: i <= step ? '#1D6FE8' : '#E8E4DD', color: i <= step ? 'white' : '#9CA3AF' }}>
            {i < step ? <CheckCircle2 size={14} strokeWidth={2.5} /> : i + 1}
          </div>
          <span className="text-sm font-medium mr-2" style={{ color: i === step ? '#1A1A1A' : '#9CA3AF' }}>{label}</span>
          {i < steps.length - 1 && <div className="w-10 h-px mr-2" style={{ background: i < step ? '#1D6FE8' : '#E8E4DD' }} />}
        </div>
      ))}
    </div>
  )
}

const ACTIVITIES = ['Téléphonie & électronique', 'Meubles & équipement', 'Alimentation & épicerie', 'Mode & vêtements', 'École & formation', 'Services professionnels', 'Immobilier', 'Autres']
const TEAM_SIZES = ['1–5', '6–20', '21–50', '50+']

function DoneScreen({ form }) {
  return (
    <div className="text-center animate-scale-in py-4">
      <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <CheckCircle2 size={32} className="text-success" />
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Compte créé !</h2>
      <p className="text-sm mb-7" style={{ color: '#6B7280' }}>
        Bienvenue, <strong style={{ color: '#1A1A1A' }}>{form.name.split(' ')[0]}</strong>.
      </p>
      <div className="rounded-xl p-4 mb-7 text-left space-y-2.5" style={{ background: '#F7F5F0' }}>
        {[['Nom', form.name], ['Email', form.email], ['Boutique', form.shop_name], ['Ville', form.city]].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span style={{ color: '#6B7280' }}>{label}</span>
            <span className="font-semibold" style={{ color: '#1A1A1A' }}>{value}</span>
          </div>
        ))}
      </div>
      <Link to="/login" className="btn btn-primary w-full justify-center gap-2">Se connecter <ArrowRight size={15} /></Link>
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore(s => s.register)
  const [step, setStep] = useState(0)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [cguAccepted, setCguAccepted] = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    shop_name: '', city: '', activity: '', employees: '1–5',
  })

  const up = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const step0Valid = form.name.trim() && form.email.trim() && form.password.length >= 8
  const step1Valid = form.shop_name.trim() && form.city.trim() && cguAccepted

  const handleStep0 = e => { e.preventDefault(); if (step0Valid) setStep(1) }

  const handleStep1 = async e => {
    e.preventDefault()
    if (!step1Valid) return
    setLoading(true)
    setError('')
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        password: form.password,
        password_confirmation: form.password,
        shop_name: form.shop_name.trim(),
        city: form.city.trim(),
        activity: form.activity || null,
        employees: form.employees,
      })
      setDone(true)
    } catch (err) {
      setError(err.message || 'Erreur lors de la création du compte')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6" style={{ background: '#F7F5F0' }}>
        <div className="w-full max-w-[420px] animate-fade-in">
          <Link to="/" className="flex items-center gap-2 justify-center mb-8">
            <Logo size={30} />
            <span className="font-bold text-xl" style={{ color: '#1A1A1A' }}>PayTrack</span>
          </Link>
          <div className="bg-white rounded-2xl p-10" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #E8E4DD' }}>
            <DoneScreen form={form} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6" style={{ background: '#F7F5F0' }}>
      <div className="w-full max-w-[420px] py-6 animate-fade-in">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <Logo size={30} />
          <span className="font-bold text-xl" style={{ color: '#1A1A1A' }}>PayTrack</span>
        </Link>

        <div className="bg-white rounded-2xl p-10" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #E8E4DD' }}>
          <Stepper step={step} />
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#1A1A1A' }}>
            {step === 0 ? 'Créer un compte' : 'Votre boutique'}
          </h1>
          <p className="text-sm mb-7" style={{ color: '#6B7280' }}>
            {step === 0 ? 'Essai gratuit 14 jours · Sans carte bancaire' : 'Quelques infos sur votre activité'}
          </p>

          {error && (
            <div className="flex items-center gap-2 text-sm text-danger bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 mb-4">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {step === 0 && (
            <form onSubmit={handleStep0} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>Nom complet *</label>
                <input type="text" required autoComplete="name" value={form.name} onChange={e => up('name', e.target.value)}
                  className="input" placeholder="Moussa Diallo" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>Email professionnel *</label>
                <input type="email" required autoComplete="email" value={form.email} onChange={e => up('email', e.target.value)}
                  className="input" placeholder="vous@email.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>Téléphone</label>
                <input type="tel" autoComplete="tel" value={form.phone} onChange={e => up('phone', e.target.value)}
                  className="input" placeholder="+221 77 000 00 00" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>Mot de passe *</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} required minLength={8}
                    value={form.password} onChange={e => up('password', e.target.value)}
                    className="input pr-11" placeholder="8 caractères minimum" />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer p-0" style={{ color: '#6B7280' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <PasswordStrength password={form.password} />
              </div>
              <button type="submit" disabled={!step0Valid} className="btn btn-primary w-full justify-center gap-2 mt-1" style={{ minHeight: 46 }}>
                Continuer <ArrowRight size={15} />
              </button>

              {/* Social Login Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-gray-400">ou s'inscrire avec</span>
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

              <p className="text-sm text-center mt-4" style={{ color: '#6B7280' }}>
                Déjà inscrit ? <Link to="/login" className="font-semibold hover:underline" style={{ color: '#1D6FE8' }}>Se connecter</Link>
              </p>
            </form>
          )}

          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>Nom de la boutique *</label>
                <input type="text" required value={form.shop_name} onChange={e => up('shop_name', e.target.value)}
                  className="input" placeholder="Phone Shop Dakar" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>Ville *</label>
                <input type="text" required value={form.city} onChange={e => up('city', e.target.value)}
                  className="input" placeholder="Dakar" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1A1A' }}>Secteur d'activité</label>
                <div className="grid grid-cols-2 gap-2">
                  {ACTIVITIES.map(act => (
                    <button key={act} type="button" onClick={() => up('activity', act)}
                      className="px-3 py-2.5 rounded-xl text-xs font-medium text-left border transition-all"
                      style={{ background: form.activity === act ? '#EEF4FE' : 'white', borderColor: form.activity === act ? '#1D6FE8' : '#E8E4DD', color: form.activity === act ? '#1D6FE8' : '#6B7280', cursor: 'pointer' }}>
                      {act}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1A1A' }}>Taille de l'équipe</label>
                <div className="flex gap-2">
                  {TEAM_SIZES.map(size => (
                    <button key={size} type="button" onClick={() => up('employees', size)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                      style={{ background: form.employees === size ? '#1D6FE8' : 'white', borderColor: form.employees === size ? '#1D6FE8' : '#E8E4DD', color: form.employees === size ? 'white' : '#6B7280', cursor: 'pointer' }}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={cguAccepted} onChange={e => setCguAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-ash accent-blue" />
                <span className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>
                  En créant un compte, j'accepte les <a href="#" className="hover:underline" style={{ color: '#1D6FE8' }}>CGU</a> et la <a href="#" className="hover:underline" style={{ color: '#1D6FE8' }}>Politique de confidentialité</a>.
                </span>
              </label>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep(0)} className="btn btn-secondary flex-shrink-0">← Retour</button>
                <button type="submit" disabled={loading || !step1Valid}
                  className="btn btn-primary flex-1 justify-center gap-2" style={{ minHeight: 46 }}>
                  {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Créer mon compte <ArrowRight size={15} /></>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
