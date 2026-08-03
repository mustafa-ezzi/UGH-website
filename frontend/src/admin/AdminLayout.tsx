import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logout } from './api'
import { useAuthStore } from './authStore'

const links = [
  { to: '/manage', end: true, label: 'Overview' },
  { to: '/manage/products', end: false, label: 'Products' },
  { to: '/manage/enquiries', end: false, label: 'Enquiries' },
  { to: '/manage/settings', end: false, label: 'Site settings' },
]

export function AdminLayout() {
  const user = useAuthStore((s) => s.user)
  const clearSession = useAuthStore((s) => s.clearSession)
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // clear local session anyway
    }
    clearSession()
    navigate('/manage/login', { replace: true })
  }

  return (
    <div className="manage-shell">
      <aside className="manage-sidebar">
        <div className="manage-brand">
          <p className="manage-brand__eyebrow">UGH Appliances</p>
          <h1>Manage</h1>
        </div>
        <nav className="manage-nav" aria-label="Manage">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                isActive ? 'manage-nav__link is-active' : 'manage-nav__link'
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="manage-sidebar__foot">
          <p className="manage-user">{user?.username ?? 'Staff'}</p>
          <button type="button" className="manage-btn manage-btn--ghost" onClick={handleLogout}>
            Sign out
          </button>
          <a className="manage-storefront-link" href="/" target="_blank" rel="noreferrer">
            View storefront
          </a>
        </div>
      </aside>
      <main className="manage-main">
        <Outlet />
      </main>
    </div>
  )
}
