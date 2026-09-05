import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, ShoppingBag, Receipt, QrCode, LogOut, Menu, X, Bell, FolderOpen, CreditCard, Package, Wallet, Crown, Truck, ClipboardList, ClipboardCheck, Building2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const VENDOR_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/clients',   icon: Users,           label: 'Clients' },
  { to: '/ventes',    icon: ShoppingBag,     label: 'Ventes' },
  { to: '/commandes', icon: Package,         label: 'Commandes' },
  { to: '/paiements', icon: Receipt,         label: 'Paiements' },
  { to: '/stock',     icon: FolderOpen,      label: 'Stock' },
  { to: '/inventaires', icon: ClipboardCheck, label: 'Inventaires' },
  { to: '/fournisseurs', icon: Truck,        label: 'Fournisseurs' },
  { to: '/commandes-fournisseurs', icon: ClipboardList, label: 'Cmd fournisseurs' },
  { to: '/abonnement', icon: Crown,          label: 'Abonnement' },
  { to: '/qr-scan',   icon: QrCode,          label: 'Scanner QR' },
]

const ADMIN_NAV = [
  { to: '/boutiques', icon: Building2,       label: 'Boutiques' },
  { to: '/utilisateurs', icon: Users,        label: 'Utilisateurs' },
]


const CLIENT_NAV = [
  { to: '/client/dashboard', icon: FolderOpen,  label: 'Mon dossier' },
  { to: '/client/paiements', icon: CreditCard,  label: 'Mes paiements' },
]

function initials(name = '') {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U'
}

export default function AppLayout({ children }) {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const isClient = user?.role === 'client'
  const isAdmin = ['admin_entreprise', 'super_admin'].includes(user?.role)
  const NAV = isClient ? CLIENT_NAV : VENDOR_NAV

  return (
    <div className="flex min-h-dvh" style={{ background: '#F5F6F8' }}>
      {/* Backdrop mobile */}
      {open && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        style={{ background: '#FFFFFF', borderRight: '1px solid #DCE3EC', width: 244 }}
        className={`fixed inset-y-0 left-0 z-30 flex flex-col flex-shrink-0
          transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen`}
        aria-label="Navigation principale"
      >
        {/* Logo */}
        <div className="flex items-center px-5 py-4"
          style={{ borderBottom: '1px solid #DCE3EC' }}>
          <img src="/paytrack-logo.png" alt="PayTrack" className="h-10 w-auto object-contain" />
        </div>

        {/* Shop name (vendor only) */}
        {!isClient && user?.shop && (
          <div className="px-5 py-3" style={{ borderBottom: '1px solid #DCE3EC' }}>
            <p className="text-xs font-medium truncate" style={{ color: '#6B7280' }}>
              {user.shop}
            </p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}

          {/* Admin section */}
          {isAdmin && (
            <>
              <div className="pt-3 pb-1 px-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Administration</p>
              </div>
              {ADMIN_NAV.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} onClick={() => setOpen(false)}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid #DCE3EC' }}>
          <button onClick={() => { setOpen(false); navigate('/profil') }} className="w-full flex items-center gap-2.5 px-2 py-1.5 mb-1 rounded-lg text-left hover:bg-gray-50">
            <div className="w-7 h-7 rounded-full text-white text-xs font-bold
                            flex items-center justify-center flex-shrink-0"
              style={{ background: '#3768AF', boxShadow: '0 4px 10px rgba(55,104,175,.24)' }}>
              {initials(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate leading-none mb-0.5" style={{ color: '#1A1A1A' }}>
                {user?.name}
              </p>
              <p className="text-xs capitalize truncate" style={{ color: '#6B7280' }}>
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </button>
          <button className="nav-item w-full" onClick={() => { logout(); navigate('/login') }}>
            <LogOut size={15} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden bg-white px-4 h-14 flex items-center justify-between sticky top-0 z-10"
          style={{ borderBottom: '1px solid #DCE3EC' }}>
          <div className="flex items-center">
            <img src="/paytrack-logo.png" alt="PayTrack" className="h-8 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-1">
            <button className="btn btn-ghost btn-icon" aria-label="Notifications" onClick={() => navigate('/notifications')}>
              <Bell size={17} />
            </button>
            <button className="btn btn-ghost btn-icon" onClick={() => setOpen(v => !v)}>
              {open ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-5 lg:p-8 max-w-[1480px] w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
