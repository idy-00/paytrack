import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, ArrowUpRight, QrCode, Bell, FileText,
  Smartphone, Shield, Building2, CheckCircle2,
  Star, Menu, X, Users, ShoppingBag, Check,
} from 'lucide-react'
import Logo from '@/components/ui/Logo'

/* ────────────────────────────────────────────────────────────────
   PALETTE
   bg:      #F7F5F0  — fond ivoire très doux
   blue:    #1D6FE8  — bleu pur, calme, délié
   ink:     #1A1A1A  — anthracite doux
   sub:     #6B7280  — texte secondaire
   border:  #E8E4DD  — séparateurs cohérents avec le fond
   white:   #FFFFFF  — surfaces élevées
──────────────────────────────────────────────────────────────── */

const C = {
  bg:     '#F7F5F0',
  blue:   '#1D6FE8',
  ink:    '#1A1A1A',
  sub:    '#6B7280',
  border: '#E8E4DD',
  white:  '#FFFFFF',
  blueL:  '#EEF4FE',  // bleu très léger pour les surfaces
  blueMid:'#DBEAFE',  // bleu moyen pour badges
}

// Hero : entrepreneure africaine avec smartphone à son bureau
const PHOTO = 'https://images.unsplash.com/photo-1758611972971-1c8b9c6d7822?fm=jpg&q=85&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0'
// How it works : deux hommes regardant un téléphone en boutique
const PHOTO_HOW = 'https://images.unsplash.com/photo-1774978611460-187c75449896?fm=jpg&q=80&w=900&auto=format&fit=crop&ixlib=rb-4.1.0'
// Section mobile money : femme souriante qui travaille, setting professionnel
const PHOTO_MOBILE = 'https://images.unsplash.com/photo-1765648684555-de2d0f6af467?fm=jpg&q=80&w=900&auto=format&fit=crop&ixlib=rb-4.1.0'

/* ── Scroll reveal ─────────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          const d = Number(e.target.dataset.delay || 0)
          setTimeout(() => e.target.classList.add('in'), d)
          io.unobserve(e.target)
        }
      }),
      { threshold: 0.07 }
    )
    document.querySelectorAll('.sr').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/* ── NavBar ─────────────────────────────────────────────────────── */
function Nav() {
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const fn = () => setSolid(window.scrollY > 30)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  const navStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    background: solid ? 'rgba(247,245,240,0.95)' : 'transparent',
    backdropFilter: solid ? 'blur(12px)' : 'none',
    borderBottom: solid ? `1px solid ${C.border}` : '1px solid transparent',
    transition: 'all 0.25s',
  }
  return (
    <nav style={navStyle}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <Logo size={24} />
          <span style={{ fontWeight: 700, fontSize: 16, color: C.ink, letterSpacing: '-0.03em' }}>PayTrack</span>
        </Link>
        <div id="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {[['#features','Fonctionnalités'],['#how','Comment ça marche'],['#pricing','Tarifs']].map(([h,l]) => (
            <a key={h} href={h} style={{ fontSize: 13.5, fontWeight: 500, color: C.sub, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = C.ink}
              onMouseLeave={e => e.target.style.color = C.sub}>{l}</a>
          ))}
        </div>
        <div id="nav-ctas" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/login" style={{ fontSize: 13.5, fontWeight: 600, color: C.sub, textDecoration: 'none', padding: '7px 14px', borderRadius: 7, transition: 'background 0.15s, color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = C.border; e.currentTarget.style.color = C.ink }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.sub }}>
            Connexion
          </Link>
          <Link to="/register" style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', background: C.blue, textDecoration: 'none', padding: '8px 18px', borderRadius: 8, letterSpacing: '-0.01em', transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.87'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            Démarrer gratuitement
          </Link>
        </div>
        <button id="nav-burger" onClick={() => setOpen(v => !v)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: C.ink }}>
          {open ? <X size={20}/> : <Menu size={20}/>}
        </button>
      </div>
      {open && (
        <div style={{ background: C.bg, borderTop: `1px solid ${C.border}`, padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[['#features','Fonctionnalités'],['#how','Comment ça marche'],['#pricing','Tarifs']].map(([h,l]) => (
            <a key={h} href={h} onClick={() => setOpen(false)} style={{ fontSize: 14, fontWeight: 500, color: C.ink, textDecoration: 'none', padding: '6px 0' }}>{l}</a>
          ))}
          <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
            <Link to="/login" style={{ flex: 1, textAlign: 'center', padding: '9px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontWeight: 600, color: C.ink, textDecoration: 'none' }}>Connexion</Link>
            <Link to="/register" style={{ flex: 1, textAlign: 'center', padding: '9px', background: C.blue, borderRadius: 8, fontSize: 14, fontWeight: 700, color: '#fff', textDecoration: 'none' }}>Démarrer</Link>
          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 768px) {
          #nav-links, #nav-ctas { display: none !important; }
          #nav-burger { display: block !important; }
        }
      `}</style>
    </nav>
  )
}

/* ── Page ───────────────────────────────────────────────────────── */
export default function LandingPage() {
  useReveal()

  const features = [
    { icon: QrCode,     title: 'QR Code par dossier',   desc: 'Chaque vente génère un QR Code unique. Le client consulte son dossier en temps réel. Montants masqués sans connexion.' },
    { icon: Bell,       title: 'Rappels automatiques',  desc: 'SMS, WhatsApp et email envoyés automatiquement la veille d\'une échéance et en cas de retard. Zéro intervention manuelle.' },
    { icon: FileText,   title: 'Reçus PDF instantanés', desc: 'Chaque paiement génère un reçu officiel horodaté, envoyé par email ou WhatsApp en quelques secondes.' },
    { icon: Smartphone, title: 'Mobile money intégré',  desc: 'Wave, Orange Money, Free Money. Le client paie depuis son téléphone — le solde se met à jour immédiatement.' },
    { icon: Shield,     title: 'Sécurité et traçabilité', desc: 'Journal d\'audit immuable, chiffrement des données, isolation stricte entre entreprises.' },
    { icon: Building2,  title: 'Multi-boutiques',       desc: 'Gérez plusieurs points de vente depuis un seul compte. Données strictement isolées par boutique.' },
  ]

  const steps = [
    { n: '1', title: 'Créez le dossier',         desc: 'Client, article, montant, acompte, nombre de tranches. L\'échéancier se calcule automatiquement.' },
    { n: '2', title: 'Partagez le QR Code',       desc: 'Un QR Code unique est généré. Envoyez-le par WhatsApp ou imprimez-le sur le contrat.' },
    { n: '3', title: 'Encaissez les tranches',    desc: 'À chaque versement, saisissez le montant. Le reçu PDF part automatiquement.' },
    { n: '4', title: 'Suivez en temps réel',      desc: 'Rappels automatiques, dashboard live, retards signalés immédiatement.' },
  ]

  const plans = [
    {
      plan: 'Démarrage', price: 'Gratuit', period: 'Pour toujours', hi: false,
      features: ['50 ventes / mois', '2 vendeurs', 'QR Code par dossier', 'Reçus PDF', 'Dashboard'],
      cta: 'Commencer gratuitement',
    },
    {
      plan: 'Professionnel', price: '9 900 FCFA', period: 'par mois · par boutique', hi: true, badge: 'Le plus populaire',
      features: ['Ventes illimitées', 'Vendeurs illimités', 'Rappels SMS & WhatsApp', 'Wave · Orange Money', 'Export PDF / CSV', 'Rapports avancés'],
      cta: 'Essai 14 jours gratuit',
    },
    {
      plan: 'Entreprise', price: 'Sur devis', period: 'Multi-boutiques', hi: false,
      features: ['Boutiques illimitées', 'Rôles & permissions', 'Intégration sur mesure', 'Support prioritaire', 'Audit log complet'],
      cta: 'Nous contacter',
    },
  ]

  return (
    <>
      <style>{`
        .sr { opacity: 0; transform: translateY(20px); transition: opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1); }
        .sr.in { opacity: 1; transform: none; }
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .feat-grid { grid-template-columns: 1fr 1fr !important; }
          .how-grid  { grid-template-columns: 1fr !important; }
          .plan-grid { grid-template-columns: 1fr !important; }
          .testi-grid{ grid-template-columns: 1fr !important; }
          .hero-photo { display: none !important; }
        }
        @media (max-width: 600px) {
          .feat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ background: C.bg, fontFamily: '"Geist", system-ui, sans-serif' }}>
        <Nav />

        {/* ══ HERO ════════════════════════════════════════════════ */}
        <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100svh', alignItems: 'center', gap: 64, paddingTop: 60 }}>

            {/* Gauche — texte */}
            <div style={{ paddingTop: 40 }}>
              {/* Indicateur de confiance discret */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.blueL, border: `1px solid ${C.blueMid}`, borderRadius: 99, padding: '5px 14px', marginBottom: 36 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.blue, display: 'inline-block' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.blue, letterSpacing: '-0.01em' }}>+200 commerçants actifs au Sénégal</span>
              </div>

              <h1 style={{
                fontSize: 'clamp(44px, 5.5vw, 72px)',
                fontWeight: 800,
                lineHeight: 1.06,
                letterSpacing: '-0.04em',
                color: C.ink,
                margin: '0 0 24px',
              }}>
                Gérez vos ventes à crédit<br />
                <span style={{ color: C.blue }}>sans friction.</span>
              </h1>

              <p style={{ fontSize: 18, lineHeight: 1.65, color: C.sub, maxWidth: 440, margin: '0 0 40px', fontWeight: 400 }}>
                QR Code par dossier, reçus PDF automatiques,
                rappels SMS et WhatsApp. Conçu pour les commerçants sénégalais.
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
                <Link to="/register" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: C.blue, color: '#fff',
                  padding: '13px 24px', borderRadius: 10,
                  fontSize: 15, fontWeight: 700, textDecoration: 'none',
                  letterSpacing: '-0.02em', transition: 'opacity 0.15s, transform 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}>
                  Démarrer gratuitement <ArrowRight size={16} />
                </Link>
                <a href="#how" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: C.white, color: C.ink,
                  padding: '13px 24px', borderRadius: 10,
                  fontSize: 15, fontWeight: 600, textDecoration: 'none',
                  border: `1.5px solid ${C.border}`, letterSpacing: '-0.02em',
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#9CA3AF'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                  Voir comment ça marche
                </a>
              </div>

              {/* Stats ligne */}
              <div style={{ display: 'flex', gap: 32, paddingTop: 32, borderTop: `1px solid ${C.border}` }}>
                {[['200+','Commerçants actifs'],['98%','Taux de recouvrement'],['5K+','Ventes gérées']].map(([val, label]) => (
                  <div key={label}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: C.ink, letterSpacing: '-0.04em', lineHeight: 1, fontFamily: '"Geist Mono", monospace' }}>{val}</div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: C.sub, marginTop: 4, letterSpacing: '0.01em' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Droite — photo */}
            <div className="hero-photo" style={{ position: 'relative', height: '80vh', maxHeight: 620, borderRadius: 20, overflow: 'hidden' }}>
              <img
                src={PHOTO}
                alt="Commerce sénégalais"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
              />
              {/* Overlay bleu très léger pour cohérence avec la palette */}
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(29,111,232,0.06)', mixBlendMode: 'multiply' }} />
              {/* Carte flottante bas */}
              <div style={{
                position: 'absolute', bottom: 20, left: 20, right: 20,
                background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)',
                borderRadius: 12, padding: '14px 18px',
                border: '1px solid rgba(255,255,255,0.8)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ fontSize: 11, color: C.sub, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2 }}>Paiement reçu</p>
                  <p style={{ fontSize: 18, color: C.ink, fontWeight: 800, fontFamily: '"Geist Mono", monospace', letterSpacing: '-0.02em' }}>108 334 FCFA</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF4', padding: '6px 12px', borderRadius: 99, border: '1px solid #BBF7D0' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#16A34A' }} />
                  <span style={{ fontSize: 12, color: '#15803D', fontWeight: 700 }}>Wave · Confirmé</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ══ FEATURES ════════════════════════════════════════════ */}
        <section id="features" style={{ padding: '100px 32px', maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 52, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p className="sr" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.blue, marginBottom: 12 }}>Fonctionnalités</p>
              <h2 className="sr" data-delay="60" style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, letterSpacing: '-0.04em', color: C.ink, margin: 0, lineHeight: 1.1 }}>
                Tout ce dont vous avez besoin.
              </h2>
            </div>
            <Link to="/register" className="sr" data-delay="80"
              style={{ fontSize: 14, fontWeight: 600, color: C.blue, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Essai gratuit 14 jours <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {features.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="sr" data-delay={i * 50}
                style={{
                  background: C.white, borderRadius: 14, padding: '28px 28px 32px',
                  border: `1px solid ${C.border}`,
                  transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; e.currentTarget.style.borderColor = '#C7D9F8' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = C.border }}>
                <div style={{ width: 40, height: 40, background: C.blueL, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Icon size={20} color={C.blue} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.65, color: C.sub, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ LOGOS INTÉGRATIONS ══════════════════════════════════ */}
        <section style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: C.white, padding: '36px 32px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.sub, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
              Intégrations
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
              {[
                { name: 'Wave', color: '#0085C7' },
                { name: 'Orange Money', color: '#FF6600' },
                { name: 'Free Money', color: '#009900' },
                { name: 'WhatsApp', color: '#25D366' },
                { name: 'SMS', color: '#6B7280' },
                { name: 'PDF', color: '#DC2626' },
              ].map(({ name, color }) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ HOW IT WORKS ════════════════════════════════════════ */}
        <section id="how" style={{ background: C.white, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
          <div className="how-grid" style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>

            {/* Gauche — steps */}
            <div>
              <p className="sr" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.blue, marginBottom: 12 }}>Comment ça marche</p>
              <h2 className="sr" data-delay="60" style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, letterSpacing: '-0.04em', color: C.ink, marginBottom: 48, lineHeight: 1.1 }}>
                En 4 étapes simples.
              </h2>
              <div>
                {steps.map(({ n, title, desc }, i) => (
                  <div key={n} className="sr" data-delay={i * 70}
                    style={{ display: 'flex', gap: 20, paddingBottom: 28, marginBottom: 28, borderBottom: i < steps.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.blueL, border: `1.5px solid ${C.blueMid}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.blue }}>{n}</span>
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', marginBottom: 6 }}>{title}</h3>
                      <p style={{ fontSize: 13.5, lineHeight: 1.65, color: C.sub, margin: 0 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Droite — photo */}
            <div className="sr" data-delay="160"
              style={{ borderRadius: 20, overflow: 'hidden', aspectRatio: '4/5', position: 'relative' }}>
              <img
                src={PHOTO_HOW}
                alt="Commerce sénégalais"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(29,111,232,0.06)' }} />
              <div style={{
                position: 'absolute', bottom: 20, left: 20, right: 20,
                background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
                borderRadius: 10, padding: '12px 16px',
                border: '1px solid rgba(255,255,255,0.8)',
              }}>
                <p style={{ fontSize: 11, color: C.sub, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>Rappel envoyé automatiquement</p>
                <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.5, margin: 0 }}>
                  "Votre tranche de 108 334 FCFA est prévue demain."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══ TESTIMONIALS ════════════════════════════════════════ */}
        <section style={{ padding: '100px 32px', maxWidth: 1280, margin: '0 auto' }}>
          <p className="sr" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.blue, marginBottom: 12 }}>Témoignages</p>
          <h2 className="sr" data-delay="60" style={{ fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 800, letterSpacing: '-0.04em', color: C.ink, marginBottom: 48, lineHeight: 1.1 }}>
            Ce que disent nos utilisateurs.
          </h2>
          <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { text: 'Avant PayTrack, je notais tout dans un cahier. Maintenant mes clients reçoivent leurs reçus automatiquement.', name: 'Moussa Diallo', role: 'Phone Shop Dakar' },
              { text: 'Le QR Code ça change tout. Mes clients font confiance. L\'image de ma boutique a vraiment changé.', name: 'Fatou Aw', role: 'Meublés Élite, Thiès' },
              { text: 'Les rappels WhatsApp automatiques ont divisé par trois les retards de paiement dans notre établissement.', name: 'Ibrahima Kouyaté', role: 'École Sainte-Marie' },
            ].map(({ text, name, role }, i) => (
              <div key={name} className="sr" data-delay={i * 80}
                style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: '28px' }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {[1,2,3,4,5].map(j => <Star key={j} size={14} style={{ fill: '#F59E0B', color: '#F59E0B' }} />)}
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: C.sub, marginBottom: 24 }}>"{text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.blue, color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.ink, letterSpacing: '-0.01em', margin: 0 }}>{name}</p>
                    <p style={{ fontSize: 12, color: C.sub, margin: 0 }}>{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ PRICING ═════════════════════════════════════════════ */}
        <section id="pricing" style={{ background: C.white, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '100px 32px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <p className="sr" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.blue, marginBottom: 12 }}>Tarifs</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 52, flexWrap: 'wrap', gap: 12 }}>
              <h2 className="sr" data-delay="60" style={{ fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 800, letterSpacing: '-0.04em', color: C.ink, margin: 0, lineHeight: 1.1 }}>
                Simple et transparent.
              </h2>
              <p className="sr" data-delay="80" style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>Sans frais cachés. Annulez à tout moment.</p>
            </div>

            <div className="plan-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'start' }}>
              {plans.map(({ plan, price, period, features: fs, cta, hi, badge }, i) => (
                <div key={plan} className="sr" data-delay={i * 60}
                  style={{
                    borderRadius: 16, padding: '32px',
                    background: hi ? C.blue : C.bg,
                    border: hi ? 'none' : `1px solid ${C.border}`,
                    position: 'relative',
                    transform: hi ? 'translateY(-6px)' : 'none',
                    boxShadow: hi ? '0 20px 48px rgba(29,111,232,0.22)' : 'none',
                  }}>
                  {badge && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: C.ink, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 99, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                      {badge}
                    </div>
                  )}
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: hi ? 'rgba(255,255,255,0.65)' : C.sub, marginBottom: 16 }}>{plan}</p>
                  <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em', color: hi ? '#fff' : C.ink, lineHeight: 1, marginBottom: 6, fontFamily: '"Geist Mono", monospace' }}>
                    {price}
                  </div>
                  <p style={{ fontSize: 13, color: hi ? 'rgba(255,255,255,0.65)' : C.sub, marginBottom: 28 }}>{period}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {fs.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: hi ? 'rgba(255,255,255,0.9)' : C.sub, lineHeight: 1.5 }}>
                        <Check size={14} style={{ flexShrink: 0, marginTop: 2, color: hi ? 'rgba(255,255,255,0.75)' : C.blue }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" style={{
                    display: 'block', textAlign: 'center', padding: '12px 20px', borderRadius: 9,
                    fontSize: 14, fontWeight: 700, textDecoration: 'none', letterSpacing: '-0.01em',
                    transition: 'opacity 0.15s',
                    background: hi ? '#fff' : C.blue,
                    color: hi ? C.blue : '#fff',
                    border: 'none',
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    {cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CTA FINAL ═══════════════════════════════════════════ */}
        <section style={{ padding: '100px 32px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div className="sr" style={{ background: C.blue, borderRadius: 20, padding: '72px 64px', position: 'relative', overflow: 'hidden' }}>
              {/* Cercle décoratif discret */}
              <div style={{ position: 'absolute', right: -80, top: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', right: 60, bottom: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', maxWidth: 560 }}>
                <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 16 }}>
                  Prêt à ne plus perdre une seule tranche ?
                </h2>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 36 }}>
                  Créez votre compte en 2 minutes. Aucune carte bancaire requise. 14 jours gratuits.
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <Link to="/register" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: '#fff', color: C.blue,
                    padding: '13px 24px', borderRadius: 10,
                    fontSize: 15, fontWeight: 700, textDecoration: 'none',
                    letterSpacing: '-0.02em', transition: 'opacity 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    Démarrer gratuitement <ArrowRight size={16} />
                  </Link>
                  <a href="mailto:contact@paytrack.sn" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'transparent', color: 'rgba(255,255,255,0.9)',
                    padding: '13px 24px', borderRadius: 10,
                    fontSize: 15, fontWeight: 600, textDecoration: 'none',
                    border: '1.5px solid rgba(255,255,255,0.4)',
                    letterSpacing: '-0.02em', transition: 'border-color 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'}>
                    Demander une démo
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ FOOTER ══════════════════════════════════════════════ */}
        <footer style={{ borderTop: `1px solid ${C.border}`, padding: '48px 32px 40px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Logo size={22} />
                <span style={{ fontWeight: 700, fontSize: 15, color: C.ink, letterSpacing: '-0.03em' }}>PayTrack</span>
              </div>
              <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.7, maxWidth: 240 }}>
                Suivi de paiements par tranche pour les commerçants d'Afrique de l'Ouest.
              </p>
            </div>
            {[
              { h:'Produit', links:[['#features','Fonctionnalités'],['#pricing','Tarifs'],['#how','Comment ça marche'],['/login','Connexion',true]] },
              { h:'Ressources', links:[['#','Documentation'],['#','Guide'],['#','API'],['#','Intégrations']] },
              { h:'Contact', links:[['mailto:contact@paytrack.sn','contact@paytrack.sn'],['#','WhatsApp'],['#','Confidentialité'],['#','Conditions']] },
            ].map(({ h, links }) => (
              <div key={h}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.sub, marginBottom: 16 }}>{h}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {links.map(([href, label, isRoute]) => isRoute
                    ? <Link key={label} to={href} style={{ fontSize: 13, color: C.sub, textDecoration: 'none', transition: 'color 0.15s' }}
                        onMouseEnter={e => e.target.style.color = C.ink} onMouseLeave={e => e.target.style.color = C.sub}>{label}</Link>
                    : <a key={label} href={href} style={{ fontSize: 13, color: C.sub, textDecoration: 'none', transition: 'color 0.15s' }}
                        onMouseEnter={e => e.target.style.color = C.ink} onMouseLeave={e => e.target.style.color = C.sub}>{label}</a>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>© 2026 PayTrack. Tous droits réservés.</span>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>Fait pour l'Afrique de l'Ouest</span>
          </div>
        </footer>

      </div>
    </>
  )
}
