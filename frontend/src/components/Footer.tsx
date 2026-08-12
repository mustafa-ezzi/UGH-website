import { Link } from 'react-router-dom'
import { useSettings } from '../api/hooks'

export function Footer() {
  const { data: settings } = useSettings()

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">{settings?.site_name ?? 'UGH Appliances'}</div>
        <div className="site-footer__meta">
          <Link to="/catalogue">Catalogue</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Enquire</Link>
          {settings?.contact_email ? (
            <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
          ) : null}
          <span>Showcase only — no cart, no checkout</span>
        </div>
        <p className="site-footer__copy">
          © {new Date().getFullYear()} {settings?.site_name ?? 'UGH Appliances'}.{' '}
          {settings?.tagline ?? 'Precision born from heat.'}
        </p>
        <div className="site-footer__credit">
          <p>© {new Date().getFullYear()} SAMS Enterprises</p>
          <p>
            Designed by{' '}
            <a
              href="https://www.trisitesolutions.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Trisite Solutions
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
