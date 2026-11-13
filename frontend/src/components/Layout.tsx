import { Footer } from './Footer'
import { Header } from './Header'
import { PageTransition } from './PageTransition'
import { RouteSeo } from './RouteSeo'
import { ScrollToTop } from './ScrollToTop'

export function Layout() {
  return (
    <div className="layout">
      <RouteSeo />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <ScrollToTop />
      <Header />
      <main id="main" className="layout__main" tabIndex={-1}>
        <PageTransition />
      </main>
      <Footer />
    </div>
  )
}
