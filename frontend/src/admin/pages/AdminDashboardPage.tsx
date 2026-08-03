import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchDashboard } from '../api'
import { EmptyState, PageHeader } from '../components/PageHeader'

export function AdminDashboardPage() {
  const dashboard = useQuery({ queryKey: ['manage-dashboard'], queryFn: fetchDashboard })

  return (
    <div className="manage-page">
      <PageHeader
        eyebrow="Overview"
        title="Catalogue pulse"
        description="Live counts from your deployed catalogue — update products, enquiries, and homepage copy without a deploy."
      />

      {dashboard.isLoading ? <p className="manage-muted">Loading…</p> : null}
      {dashboard.isError ? (
        <p className="manage-alert">{(dashboard.error as Error).message}</p>
      ) : null}

      {dashboard.data ? (
        <>
          <div className="manage-stats">
            <article>
              <span>Products</span>
              <strong>{dashboard.data.products_total}</strong>
              <small>{dashboard.data.products_published} published</small>
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
                {dashboard.data.categories}
                <span className="manage-stats__sep">/</span>
                {dashboard.data.brands}
              </strong>
              <small>categories / brands</small>
            </article>
          </div>

          <div className="manage-quick">
            <Link to="/manage/products" className="manage-btn manage-btn--primary">
              Edit products
            </Link>
            <Link to="/manage/enquiries" className="manage-btn">
              Review enquiries
            </Link>
            <Link to="/manage/categories" className="manage-btn">
              Categories
            </Link>
            <Link to="/manage/settings" className="manage-btn">
              Homepage settings
            </Link>
          </div>

          <section className="manage-panel-block">
            <div className="manage-panel-block__head">
              <h3>Recent enquiries</h3>
              <Link to="/manage/enquiries" className="manage-link">
                View all
              </Link>
            </div>
            {(dashboard.data.recent_enquiries ?? []).length === 0 ? (
              <EmptyState title="No enquiries yet" detail="New form submissions will appear here." />
            ) : (
              <ul className="manage-recent">
                {dashboard.data.recent_enquiries.map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <small>
                        {item.product_name ?? 'General'} ·{' '}
                        {new Date(item.created_at).toLocaleString()}
                      </small>
                    </div>
                    <span className={item.is_handled ? 'manage-pill' : 'manage-pill is-on'}>
                      {item.is_handled ? 'Handled' : 'Open'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
