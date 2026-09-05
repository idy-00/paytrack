import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import OfflineScreen from '@/components/ui/OfflineScreen'

const LandingPage = lazy(() => import('@/pages/LandingPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const VendeurDashboard = lazy(() => import('@/pages/VendeurDashboard'))
const ClientDashboard = lazy(() => import('@/pages/ClientDashboard'))
const ClientPaiements = lazy(() => import('@/pages/ClientPaiements'))
const ClientSaleDetail = lazy(() => import('@/pages/ClientSaleDetail'))
const LegalPage = lazy(() => import('@/pages/LegalPage'))
const VentesPage = lazy(() => import('@/pages/VentesPage'))
const VenteDetailPage = lazy(() => import('@/pages/VenteDetailPage'))
const NouvelleVentePage = lazy(() => import('@/pages/NouvelleVentePage'))
const ClientsPage = lazy(() => import('@/pages/ClientsPage'))
const QRScanPage = lazy(() => import('@/pages/QRScanPage'))
const PaiementsPage = lazy(() => import('@/pages/PaiementsPage'))
const QRScannerPage = lazy(() => import('@/pages/QRScannerPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const StockPage = lazy(() => import('@/pages/StockPage'))
const ShopsPage = lazy(() => import('@/pages/ShopsPage'))
const UsersPage = lazy(() => import('@/pages/UsersPage'))
const AdminDashboardPage = lazy(() => import('@/pages/AdminDashboardPage'))
const AdminRapportsPage = lazy(() => import('@/pages/AdminRapportsPage'))
const AdminParametresPage = lazy(() => import('@/pages/AdminParametresPage'))
const SubscriptionPage = lazy(() => import('@/pages/SubscriptionPage'))
const WalletPage = lazy(() => import('@/pages/WalletPage'))
const OrdersPage = lazy(() => import('@/pages/OrdersPage'))
const OrderDetailPage = lazy(() => import('@/pages/OrderDetailPage'))
const NewOrderPage = lazy(() => import('@/pages/NewOrderPage'))
const SuppliersPage = lazy(() => import('@/pages/SuppliersPage'))
const SupplierOrdersPage = lazy(() => import('@/pages/SupplierOrdersPage'))
const InventoriesPage = lazy(() => import('@/pages/InventoriesPage'))
const AtaabaAdminPage = lazy(() => import('@/pages/AtaabaAdminPage'))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))

const VENDOR_ROLES = ['vendeur', 'responsable_boutique', 'admin_entreprise', 'super_admin']
const ADMIN_ROLES = ['admin_entreprise', 'super_admin']
const SUPER_ADMIN_ROLES = ['super_admin']

function PageLoader() {
  return (
    <div className="min-h-dvh grid place-items-center" role="status" aria-live="polite">
      <div className="text-center">
        <div className="w-10 h-10 rounded-xl mx-auto mb-3 animate-pulse" style={{ background: '#44AC45' }} />
        <p className="text-sm font-semibold" style={{ color: '#3768AF' }}>Chargement PayTrack…</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <OfflineScreen />
      <Suspense fallback={<PageLoader />}>
        <Routes>
        {/* Vitrine publique */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/legal/:page" element={<LegalPage />} />
        <Route path="/qr/:uuid" element={<QRScanPage />} />

        {/* Vendor routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute roles={VENDOR_ROLES}><VendeurDashboard /></ProtectedRoute>
        } />
        <Route path="/ventes" element={
          <ProtectedRoute roles={VENDOR_ROLES}><VentesPage /></ProtectedRoute>
        } />
        <Route path="/ventes/nouvelle" element={
          <ProtectedRoute roles={VENDOR_ROLES}><NouvelleVentePage /></ProtectedRoute>
        } />
        <Route path="/ventes/:id" element={
          <ProtectedRoute roles={VENDOR_ROLES}><VenteDetailPage /></ProtectedRoute>
        } />
        <Route path="/clients" element={
          <ProtectedRoute roles={VENDOR_ROLES}><ClientsPage /></ProtectedRoute>
        } />
        <Route path="/paiements" element={
          <ProtectedRoute roles={VENDOR_ROLES}><PaiementsPage /></ProtectedRoute>
        } />
        <Route path="/stock" element={
          <ProtectedRoute roles={VENDOR_ROLES}><StockPage /></ProtectedRoute>
        } />
        <Route path="/qr-scan" element={
          <ProtectedRoute roles={VENDOR_ROLES}><QRScannerPage /></ProtectedRoute>
        } />

        {/* Orders (commandes clients) */}
        <Route path="/commandes" element={
          <ProtectedRoute roles={VENDOR_ROLES}><OrdersPage /></ProtectedRoute>
        } />
        <Route path="/commandes/nouvelle" element={
          <ProtectedRoute roles={VENDOR_ROLES}><NewOrderPage /></ProtectedRoute>
        } />
        <Route path="/commandes/:id" element={
          <ProtectedRoute roles={VENDOR_ROLES}><OrderDetailPage /></ProtectedRoute>
        } />

        {/* Inventories (Pro/Business plan) */}
        <Route path="/inventaires" element={
          <ProtectedRoute roles={VENDOR_ROLES}><InventoriesPage /></ProtectedRoute>
        } />

        {/* Suppliers (Business plan - backend enforces plan limit) */}
        <Route path="/fournisseurs" element={
          <ProtectedRoute roles={VENDOR_ROLES}><SuppliersPage /></ProtectedRoute>
        } />
        <Route path="/commandes-fournisseurs" element={
          <ProtectedRoute roles={VENDOR_ROLES}><SupplierOrdersPage /></ProtectedRoute>
        } />

        {/* Wallet & Subscription */}
        <Route path="/portefeuille" element={
          <ProtectedRoute roles={VENDOR_ROLES}><WalletPage /></ProtectedRoute>
        } />
        <Route path="/abonnement" element={
          <ProtectedRoute roles={VENDOR_ROLES}><SubscriptionPage /></ProtectedRoute>
        } />
        <Route path="/profil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute roles={ADMIN_ROLES}><AdminDashboardPage /></ProtectedRoute>
        } />
        <Route path="/admin/rapports" element={
          <ProtectedRoute roles={ADMIN_ROLES}><AdminRapportsPage /></ProtectedRoute>
        } />
        <Route path="/admin/parametres" element={
          <ProtectedRoute roles={ADMIN_ROLES}><AdminParametresPage /></ProtectedRoute>
        } />
        <Route path="/boutiques" element={
          <ProtectedRoute roles={ADMIN_ROLES}><ShopsPage /></ProtectedRoute>
        } />
        <Route path="/utilisateurs" element={
          <ProtectedRoute roles={ADMIN_ROLES}><UsersPage /></ProtectedRoute>
        } />

        {/* ATAABA Super Admin */}
        <Route path="/ataaba-admin" element={
          <ProtectedRoute roles={SUPER_ADMIN_ROLES}><AtaabaAdminPage /></ProtectedRoute>
        } />

        {/* Client routes */}
        <Route path="/client/dashboard" element={
          <ProtectedRoute roles={['client']}><ClientDashboard /></ProtectedRoute>
        } />
        <Route path="/client/paiements" element={
          <ProtectedRoute roles={['client']}><ClientPaiements /></ProtectedRoute>
        } />
        <Route path="/client/vente/:id" element={
          <ProtectedRoute roles={['client']}><ClientSaleDetail /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
