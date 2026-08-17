import { useEffect, useId, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useCategories } from '../api/hooks'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/catalogue', label: 'Catalogue' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const [catsOpen, setCatsOpen] = useState(false)
  const { data: categories = [] } = useCategories()
  const panelRef = useRef<HTMLDivElement>(null)
  const catsPanelId = useId()

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setCatsOpen(false)
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setCatsOpen(false)
        setOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <NavLink
          to="/"
          className="site-header__brand"
          onClick={() => setOpen(false)}
          aria-label="United Gas & Home Appliances home"
        >
          <span className="site-header__brand-mark" aria-hidden="true">
            United Gas
          </span>
          <span className="site-header__brand-sub" aria-hidden="true">
            & Home Appliances
          </span>
        </NavLink>

        <button
          type="button"
          className="site-header__toggle"
          aria-expanded={open}
          aria-controls="primary-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>

        <nav
          id="primary-nav"
          className={`site-header__nav${open ? ' is-open' : ''}`}
          aria-label="Primary"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}

          <div className="site-header__mega" ref={panelRef}>
            <button
              type="button"
              className="site-header__mega-trigger"
              aria-expanded={catsOpen}
              aria-haspopup="menu"
              aria-controls={catsPanelId}
              onClick={(e) => {
                e.stopPropagation()
                setCatsOpen((v) => !v)
              }}
            >
              Categories
            </button>
            {catsOpen ? (
              <div
                id={catsPanelId}
                className="site-header__mega-panel"
                role="menu"
                aria-label="Product categories"
              >
                {categories.map((category) => (
                  <NavLink
                    key={category.id}
                    to={`/catalogue/${category.slug}`}
                    role="menuitem"
                    onClick={() => {
                      setCatsOpen(false)
                      setOpen(false)
                    }}
                  >
                    {category.name}
                  </NavLink>
                ))}
                <NavLink
                  to="/catalogue"
                  role="menuitem"
                  onClick={() => {
                    setCatsOpen(false)
                    setOpen(false)
                  }}
                >
                  View all
                </NavLink>
              </div>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  )
}
