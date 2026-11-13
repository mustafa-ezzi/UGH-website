import { Link } from 'react-router-dom'
import { useSettings } from '../api/hooks'
import { HOUSE_BRAND, displaySiteName } from '../lib/brand'

export function Footer() {
  const { data: settings } = useSettings()
  const siteName = displaySiteName(settings?.site_name)

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__identity">
          <p className="site-footer__brand">Macson&apos;s</p>
          <p className="site-footer__house">A Product By {HOUSE_BRAND}</p>
        </div>

        <nav className="site-footer__meta" aria-label="Footer">
          <div className="site-footer__links">
            <Link to="/catalogue">Catalogue</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Enquire</Link>
          </div>
          {settings?.contact_email ? (
            <a className="site-footer__mail" href={`mailto:${settings.contact_email}`}>
              {settings.contact_email}
            </a>
          ) : null}
          <span className="site-footer__note">Showcase only — no cart, no checkout</span>
        </nav>

        <div className="site-footer__bottom">
          <p className="site-footer__copy">
            © {new Date().getFullYear()} {siteName}.{' '}
            {settings?.tagline ?? 'Precision born from heat.'}
          </p>
          <p className="site-footer__credit">
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
