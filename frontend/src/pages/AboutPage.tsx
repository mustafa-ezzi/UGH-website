import { Link } from 'react-router-dom'
import { useSettings } from '../api/hooks'
import { Reveal } from '../components/Reveal'
import { StatusMessage } from '../components/StatusMessage'

export function AboutPage() {
  const settings = useSettings()

  return (
    <section className="page-shell page-shell--mist">
      <div className="u-container about-page">
        <Reveal>
          <p className="u-eyebrow">About</p>
          <h1 className="page-title page-title--dark">The kitchen, remade</h1>
        </Reveal>
        {settings.isLoading ? (
          <StatusMessage title="Loading…" />
        ) : settings.isError ? (
          <StatusMessage tone="error" title="Could not load brand details" />
        ) : (
          <>
            <Reveal delay={0.08}>
              <p className="page-lede page-lede--dark">
                {settings.data?.tagline || 'Precision born from heat.'}
              </p>
            </Reveal>
            <Reveal delay={0.14} className="about-page__body">
              <p>
                {settings.data?.about_blurb ||
                  'UGH Appliances is a catalogue showcase for refined home kitchen appliances — editorial presence, no checkout noise.'}
              </p>
              <p>
                Browse stoves, chimneys, ovens, sinks, and hardware. When something fits your
                space, enquire — our team responds with availability and guidance.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <Link to="/contact" className="btn-ember">
                Contact us
              </Link>
            </Reveal>
          </>
        )}
      </div>
    </section>
  )
}
