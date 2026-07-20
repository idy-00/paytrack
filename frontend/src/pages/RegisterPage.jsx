import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import { useAuthStore } from '@/store/authStore'
import { MOCK_USERS } from '@/lib/mockData'

// ── Password strength bar ────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  const colors = ['', '#DC2626', '#D97706', '#0EA5E9', '#16A34A']
  const labels = ['', 'Faible', 'Moyen', 'Bon', 'Fort']
  const color  = colors[score]
  const label  = labels[score]

  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full transition-colors duration-200"
            style={{ background: i <= score ? color : '#E8E4DD' }} />
        ))}
      </div>
      <span className="text-xs font-semibold w-8 text-right" style={{ color }}>{label}</span>
    </div>
  )
}

// ── Stepper ──────────────────────────────────────────────────────────
function Stepper({ step }) {
  const steps = ['Votre compte', 'Votre boutique']
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          {/* Circle */}
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
            style={{
              background: i <= step ? '#1D6FE8' : '#E8E4DD',
              color:      i <= step ? 'white'   : '#9CA3AF',
            }}>
            {i < step ? <CheckCircle2 size={14} strokeWidth={2.5} /> : i + 1}
          </div>
          {/* Label */}
          <span className="text-sm font-medium mr-2 transition-colors"
            style={{ color: i === step ? '#1A1A1A' : '#9CA3AF' }}>
            {label}
          </span>
          {/* Connector */}
          {i < steps.length - 1 && (
            <div className="w-10 h-px mr-2 transition-colors"
              style={{ background: i < step ? '#1D6FE8' : '#E8E4DD' }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Activity sectors ─────────────────────────────────────────────────
const ACTIVITIES = [
  'Téléphonie & électronique',
  'Meubles & équipement',
  'Alimentation & épicerie',
  'Mode & vêtements',
  'École & formation',
  'Services professionnels',
  'Immobilier',
  'Autres',
]

const TEAM_SIZES = ['1–5', '6–20', '21–50', '50+']

// ── Done confirmation ────────────────────────────────────────────────
function DoneScreen({ form }) {
  return (
    <div className="text-center animate-scale-in py-4">
      <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <CheckCircle2 size={32} className="text-success" />
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Compte créé !</h2>
      <p className="text-sm mb-1.5" style={{ color: '#6B7280' }}>
        Bienvenue, <strong style={{ color: '#1A1A1A' }}>{form.name.split(' ')[0]}</strong>.
      </p>
      <p className="text-sm mb-7" style={{ color: '#6B7280' }}>
        Email de confirmation envoyé à <strong style={{ color: '#1A1A1A' }}>{form.email}</strong>.
      </p>

      <div className="rounded-xl p-4 mb-7 text-left space-y-2.5" style={{ background: '#F7F5F0' }}>
        {[
          ['Nom',      form.name],
          ['Email',    form.email],
          ['Boutique', form.shop_name],
          ['Ville',    form.city],
          ['Secteur',  form.activity || '—'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span style={{ color: '#6B7280' }}>{label}</span>
            <span className="font-semibold" style={{ color: '#1A1A1A' }}>{value}</span>
          </div>
        ))}
      </div>

      <Link to="/login" className="btn btn-primary w-full justify-center gap-2">
        Aller à la connexion <ArrowRight size={15} />
      </Link>
    </div>
  )
}

// ── RegisterPage ─────────────────────────────────────────────────────
export default function RegisterPage() {
  const [step, setStep]       = useState(0)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [cguAccepted, setCguAccepted] = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    shop_name: '', city: '', activity: '', employees: '1–5',
  })

  const up = (key, val) => setForm(f => ({ ...f, [key]: val }))

  // Step 1 validation
  const step0Valid = form.name.trim() && form.email.trim() && form.password.length >= 8

  // Step 2 validation
  const step1Valid = form.shop_name.trim() && form.city.trim() && cguAccepted

  const handleStep0 = e => {
    e.preventDefault()
    if (step0Valid) setStep(1)
  }

  const handleStep1 = async e => {
    e.preventDefault()
    if (!step1Valid) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setLoading(false)
    setDone(true)
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

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <Logo size={30} />
          <span className="font-bold text-xl" style={{ color: '#1A1A1A' }}>PayTrack</span>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl p-10" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #E8E4DD' }}>
          {/* Stepper */}
          <Stepper step={step} />

          {/* Heading */}
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#1A1A1A' }}>
            {step === 0 ? 'Créer un compte' : 'Votre boutique'}
          </h1>
          <p className="text-sm mb-7" style={{ color: '#6B7280' }}>
            {step === 0
              ? 'Essai gratuit 14 jours · Sans carte bancaire'
              : 'Quelques infos sur votre activité'
            }
          </p>

          {/* ── STEP 0: personal info ── */}
          {step === 0 && (
            <form onSubmit={handleStep0} className="space-y-4">
              {/* Nom */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>
                  Nom complet <span className="text-danger">*</span>
                </label>
                <input type="text" required autoComplete="name"
                  value={form.name} onChange={e => up('name', e.target.value)}
                  className="input" placeholder="Moussa Diallo" />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>
                  Email professionnel <span className="text-danger">*</span>
                </label>
                <input type="email" required autoComplete="email"
                  value={form.email} onChange={e => up('email', e.target.value)}
                  className="input" placeholder="vous@email.com" />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>
                  Téléphone <span className="text-xs font-normal" style={{ color: '#6B7280' }}>(optionnel)</span>
                </label>
                <input type="tel" autoComplete="tel"
                  value={form.phone} onChange={e => up('phone', e.target.value)}
                  className="input" placeholder="+221 77 000 00 00" />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>
                  Mot de passe <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} required minLength={8}
                    value={form.password} onChange={e => up('password', e.target.value)}
                    className="input pr-11" placeholder="8 caractères minimum" />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:text-dim bg-transparent border-0 cursor-pointer p-0"
                    style={{ color: '#6B7280' }}
                    tabIndex={-1}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <PasswordStrength password={form.password} />
              </div>

              <button type="submit" disabled={!step0Valid}
                className="btn btn-primary w-full justify-center gap-2 mt-1"
                style={{ minHeight: 46 }}>
                Continuer <ArrowRight size={15} />
              </button>

              <p className="text-sm text-center mt-4" style={{ color: '#6B7280' }}>
                Déjà inscrit ?{' '}
                <Link to="/login" className="font-semibold hover:underline" style={{ color: '#1D6FE8' }}>Se connecter</Link>
              </p>
            </form>
          )}

          {/* ── STEP 1: shop info ── */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-5">
              {/* Shop name */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>
                  Nom de la boutique <span className="text-danger">*</span>
                </label>
                <input type="text" required
                  value={form.shop_name} onChange={e => up('shop_name', e.target.value)}
                  className="input" placeholder="Phone Shop Dakar" />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>
                  Ville <span className="text-danger">*</span>
                </label>
                <input type="text" required
                  value={form.city} onChange={e => up('city', e.target.value)}
                  className="input" placeholder="Dakar" />
              </div>

              {/* Activity sector */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1A1A' }}>
                  Secteur d'activité
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ACTIVITIES.map(act => (
                    <button key={act} type="button" onClick={() => up('activity', act)}
                      className="px-3 py-2.5 rounded-xl text-xs font-medium text-left border transition-all"
                      style={{
                        background:   form.activity === act ? '#EEF4FE' : 'white',
                        borderColor:  form.activity === act ? '#1D6FE8' : '#E8E4DD',
                        color:        form.activity === act ? '#1D6FE8' : '#6B7280',
                        cursor: 'pointer',
                      }}>
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              {/* Team size */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1A1A' }}>
                  Taille de l'équipe
                </label>
                <div className="flex gap-2">
                  {TEAM_SIZES.map(size => (
                    <button key={size} type="button" onClick={() => up('employees', size)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                      style={{
                        background:  form.employees === size ? '#1D6FE8' : 'white',
                        borderColor: form.employees === size ? '#1D6FE8' : '#E8E4DD',
                        color:       form.employees === size ? 'white'   : '#6B7280',
                        cursor: 'pointer',
                      }}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* CGU acceptance */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={cguAccepted} onChange={e => setCguAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-ash accent-blue" />
                <span className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>
                  En créant un compte, j'accepte les{' '}
                  <a href="#" className="hover:underline" style={{ color: '#1D6FE8' }}>Conditions d'utilisation</a>
                  {' '}et la{' '}
                  <a href="#" className="hover:underline" style={{ color: '#1D6FE8' }}>Politique de confidentialité</a>
                  {' '}de PayTrack.
                </span>
              </label>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep(0)}
                  className="btn btn-secondary flex-shrink-0">
                  ← Retour
                </button>
                <button type="submit" disabled={loading || !step1Valid}
                  className="btn btn-primary flex-1 justify-center gap-2"
                  style={{ minHeight: 46 }}>
                  {loading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <>Créer mon compte <ArrowRight size={15} /></>
                  }
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
