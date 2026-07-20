import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import AppLayout from './AppLayout'

function homeForRole(role) {
  return role === 'client' ? '/client/dashboard' : '/dashboard'
}

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to={homeForRole(user?.role)} replace />
  }

  return <AppLayout>{children}</AppLayout>
}
