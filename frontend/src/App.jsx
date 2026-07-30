import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
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

const VENDOR_ROLES = ['vendeur', 'responsable_boutique', 'admin_entreprise', 'super_admin']

export default function App() {
  return (
    <BrowserRouter>
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
