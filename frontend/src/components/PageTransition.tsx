import { Outlet } from 'react-router-dom'

/** Pass-through outlet — page fade transitions were removed for performance. */
export function PageTransition() {
  return <Outlet />
}
