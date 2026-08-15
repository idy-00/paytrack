import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import OfflineScreen from '@/components/ui/OfflineScreen'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import VendeurDashboard from '@/pages/VendeurDashboard'
import ClientDashboard from '@/pages/ClientDashboard'
import ClientPaiements from '@/pages/ClientPaiements'
import VentesPage from '@/pages/VentesPage'
import VenteDetailPage from '@/pages/VenteDetailPage'
import NouvelleVentePage from '@/pages/NouvelleVentePage'
import ClientsPage from '@/pages/ClientsPage'
import QRScanPage from '@/pages/QRScanPage'
import PaiementsPage from '@/pages/PaiementsPage'
import QRScannerPage from '@/pages/QRScannerPage'
import RegisterPage from '@/pages/RegisterPage'
import StockPage from '@/pages/StockPage'
import ShopsPage from '@/pages/ShopsPage'
import UsersPage from '@/pages/UsersPage'
import AdminDashboardPage from '@/pages/AdminDashboardPage'
import AdminRapportsPage from '@/pages/AdminRapportsPage'
import AdminParametresPage from '@/pages/AdminParametresPage'
// New pages
import SubscriptionPage from '@/pages/SubscriptionPage'
import WalletPage from '@/pages/WalletPage'
import OrdersPage from '@/pages/OrdersPage'
import OrderDetailPage from '@/pages/OrderDetailPage'
import NewOrderPage from '@/pages/NewOrderPage'
import SuppliersPage from '@/pages/SuppliersPage'
import SupplierOrdersPage from '@/pages/SupplierOrdersPage'
import InventoriesPage from '@/pages/InventoriesPage'
import AtaabaAdminPage from '@/pages/AtaabaAdminPage'

const VENDOR_ROLES = ['vendeur', 'responsable_boutique', 'admin_entreprise', 'super_admin']
const ADMIN_ROLES = ['admin_entreprise', 'super_admin']
const SUPER_ADMIN_ROLES = ['super_admin']

export default function App() {
  return (
    <BrowserRouter>
      <OfflineScreen />
      <Routes>
        {/* Vitrine publique */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
