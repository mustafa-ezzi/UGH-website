import { useSettings } from '../api/hooks'
import { EnquiryForm } from '../components/EnquiryForm'
import { Reveal } from '../components/Reveal'
import { StatusMessage } from '../components/StatusMessage'
import { buildWhatsAppUrl } from '../lib/format'
import { displaySiteName } from '../lib/brand'

export function ContactPage() {
  const settings = useSettings()

  return (
    <section className="page-shell page-shell--mist">
      <div className="u-container contact-page">
        <Reveal className="contact-page__intro">
          <p className="u-eyebrow">Contact</p>
          <h1 className="page-title page-title--dark">Enquire</h1>
          <p className="page-lede page-lede--dark">
            Ask about availability, finishes, and showroom visits. No cart — just a conversation.
          </p>

          {settings.isLoading ? (
            <StatusMessage title="Loading contact details…" />
          ) : settings.isError ? (
            <StatusMessage tone="error" title="Could not load contact details" />
          ) : (
            <ul className="contact-page__details">
              {settings.data?.contact_email ? (
                <li>
                  <span>Email</span>
                  <a href={`mailto:${settings.data.contact_email}`}>{settings.data.contact_email}</a>
                </li>
              ) : null}
              {settings.data?.contact_phone ? (
                <li>
                  <span>Phone</span>
                  <a href={`tel:${settings.data.contact_phone}`}>{settings.data.contact_phone}</a>
                </li>
              ) : null}
              {settings.data?.whatsapp ? (
                <li>
                  <span>WhatsApp</span>
                  <a
                    href={
                      buildWhatsAppUrl(
                        settings.data.whatsapp,
                        `Hello ${displaySiteName(settings.data.site_name)}, I would like to make an enquiry.`,
                      ) ?? undefined
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {settings.data.whatsapp}
                  </a>
                </li>
              ) : null}
              {settings.data?.address ? (
                <li>
                  <span>Address</span>
                  <span>{settings.data.address}</span>
                </li>
              ) : null}
            </ul>
          )}
        </Reveal>

        <Reveal delay={0.1}>
          <EnquiryForm />
        </Reveal>
      </div>
    </section>
  )
}
