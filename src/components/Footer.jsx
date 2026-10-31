import Link from 'next/link'
import { hours } from '../data/site'
import { Container } from './ui'

export default function Footer({ motionPaused, motionReduced, onToggleMotion }) {
  return <footer id="visit" className="site-footer coastal-footer">
    <Container>
      <div className="coastal-footer-top"><p className="overline">Stay a little longer</p><p className="footer-wordmark">Tamarind <em>&amp;</em> Tide<span>A little coast. A lot of soul.</span></p></div>
      <div className="coastal-footer-grid">
        <section><h2>A table by the tide.</h2><p>Coastal flavours, warm company and an evening that takes its time.</p><p className="coastal-footer-location">Konark, Odisha<br /><span>Bay of Bengal · India</span></p><Link href="/reservations" className="button-primary">Reserve your evening ↗</Link></section>
        <section className="coastal-footer-hours" aria-labelledby="hours-title"><h2 id="hours-title">Come on in.</h2><table><caption className="sr-only">Opening hours</caption><tbody>{hours.map(row => <tr key={row.days}><th scope="row">{row.days}</th><td>{row.time}</td></tr>)}</tbody></table><p>Created with care by <strong>Roman Parwez.</strong></p><Link href="/account" className="text-link">Your account ↗</Link></section>
        <section className="coastal-map" aria-labelledby="location-title"><div><h2 id="location-title">Meet us in Konark.</h2><a href="https://www.google.com/maps/search/?api=1&query=Konark%2C%20Odisha%2C%20India" target="_blank" rel="noopener noreferrer" aria-label="Open Konark, Odisha in Google Maps">↗</a></div><iframe title="Google Maps — Konark, Odisha" src="https://maps.google.com/maps?q=Konark%2C%20Odisha%2C%20India&z=13&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /><p>Area map · Konark, Odisha</p></section>
      </div>
      <div className="coastal-footer-bottom"><p>© 2026 Tamarind &amp; Tide · Designed &amp; built by Roman Parwez</p><div><button type="button" onClick={onToggleMotion} aria-pressed={motionPaused} disabled={motionReduced} className="motion-toggle">{motionReduced ? 'Motion reduced' : motionPaused ? 'Resume motion' : 'Pause motion'}</button><Link href="/#home">Back to the shore ↑</Link></div></div>
    </Container>
  </footer>
}
