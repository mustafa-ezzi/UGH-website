import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchDashboard } from '../api'

export function AdminDashboardPage() {
  const dashboard = useQuery({ queryKey: ['manage-dashboard'], queryFn: fetchDashboard })

  return (
    <div className="manage-page">
      <header className="manage-page__header">
        <div>
          <p className="manage-brand__eyebrow">Overview</p>
          <h2>Catalogue pulse</h2>
        </div>
      </header>

      {dashboard.isLoading ? <p className="manage-muted">Loading…</p> : null}
      {dashboard.isError ? (
        <p className="manage-alert">{(dashboard.error as Error).message}</p>
      ) : null}

      {dashboard.data ? (
        <div className="manage-stats">
          <article>
            <span>Products</span>
            <strong>{dashboard.data.products_total}</strong>
            <small>{dashboard.data.products_published} live</small>
          </article>
          <article>
            <span>Featured</span>
            <strong>{dashboard.data.products_featured}</strong>
            <small>homepage picks</small>
          </article>
          <article>
            <span>Open enquiries</span>
            <strong>{dashboard.data.enquiries_open}</strong>
            <small>{dashboard.data.enquiries_total} total</small>
          </article>
          <article>
            <span>Taxonomy</span>
            <strong>
              {dashboard.data.categories}/{dashboard.data.brands}
            </strong>
            <small>categories / brands</small>
          </article>
        </div>
      ) : null}

      <div className="manage-quick">
        <Link to="/manage/products" className="manage-btn manage-btn--primary">
          Edit products
        </Link>
        <Link to="/manage/enquiries" className="manage-btn">
          Review enquiries
        </Link>
        <Link to="/manage/settings" className="manage-btn">
          Homepage settings
        </Link>
      </div>
    </div>
  )
}
