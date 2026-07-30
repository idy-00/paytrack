import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, ShoppingBag, Receipt, QrCode, LogOut, Menu, X, Bell, FolderOpen, CreditCard } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import Logo from '@/components/ui/Logo'

const VENDOR_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/clients',   icon: Users,           label: 'Clients' },
  { to: '/ventes',    icon: ShoppingBag,     label: 'Ventes' },
  { to: '/paiements', icon: Receipt,         label: 'Paiements' },
  { to: '/stock',     icon: FolderOpen,      label: 'Stock' },
  { to: '/qr-scan',   icon: QrCode,          label: 'Scanner QR' },
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
  const NAV = isClient ? CLIENT_NAV : VENDOR_NAV

  return (
    <div className="flex min-h-dvh bg-snow">
      {/* Backdrop mobile */}
      {open && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        style={{ background: '#FFFFFF', borderRight: '1px solid #E8E4DD', width: 220 }}
        className={`fixed inset-y-0 left-0 z-30 flex flex-col flex-shrink-0
          transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen`}
        aria-label="Navigation principale"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5"
          style={{ borderBottom: '1px solid #E8E4DD' }}>
          <Logo size={26} />
          <span className="font-bold text-lg leading-none" style={{ color: '#1A1A1A' }}>PayTrack</span>
        </div>

        {/* Shop name (vendor only) */}
        {!isClient && user?.shop && (
          <div className="px-5 py-2.5" style={{ borderBottom: '1px solid #E8E4DD' }}>
            <p className="text-xs font-medium truncate" style={{ color: '#6B7280' }}>
              {user.shop}
            </p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid #E8E4DD' }}>
          <div className="flex items-center gap-2.5 px-2 py-1.5 mb-1">
            <div className="w-7 h-7 rounded-full text-white text-xs font-bold
                            flex items-center justify-center flex-shrink-0"
              style={{ background: '#1D6FE8' }}>
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
          </div>
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
          style={{ borderBottom: '1px solid #E8E4DD' }}>
          <div className="flex items-center gap-2">
            <Logo size={22} />
            <span className="font-bold" style={{ color: '#1A1A1A' }}>PayTrack</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="btn btn-ghost btn-icon" aria-label="Notifications">
              <Bell size={17} />
            </button>
            <button className="btn btn-ghost btn-icon" onClick={() => setOpen(v => !v)}>
              {open ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-7 max-w-[1440px] w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
