import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from './authStore'

export function RequireAuth() {
  const token = useAuthStore((s) => s.token)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/manage/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
