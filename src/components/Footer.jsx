import { btn, btnSmall } from '../classes'
import { hours } from '../data/site'
import { Container } from './ui'

const heading = 'mb-3 font-display text-2xl font-bold text-turmeric'
const link = 'underline-offset-4 [overflow-wrap:anywhere] hover:text-turmeric'

export default function Footer() {
  return (
    <footer id="visit" className="bg-ink-deep pt-10 pb-6 text-cream">
      {/* 1 column -> 2 at sm -> 3 at lg */}
      <Container className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        <section aria-labelledby="hours-title">
          <h2 id="hours-title" className={heading}>Hours</h2>
          <table className="w-full border-collapse">
            <caption className="sr-only">Opening hours</caption>
            <tbody>
              {hours.map((row) => (
                <tr key={row.days} className="border-b border-dashed border-line-light">
                  <th scope="row" className="py-2.5 pr-4 text-left align-top font-medium whitespace-nowrap">{row.days}</th>
                  <td className={`py-2.5 text-right ${row.closed ? 'text-[#f2a08f]' : ''}`}>{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section aria-labelledby="location-title">
          <h2 id="location-title" className={heading}>Find us</h2>
          <address className="mb-4 not-italic">
            14 Lighthouse Hill Road
            <br />
            Hampankatta, Mangaluru 575001
            <br />
            Karnataka, India
          </address>
          <a href="https://maps.google.com/?q=Lighthouse+Hill+Road+Mangaluru" target="_blank" rel="noopener" className={link}>
            Open in Maps ↗
          </a>
        </section>

        <section aria-labelledby="contact-title">
          <h2 id="contact-title" className={heading}>Say hello</h2>
          <ul className="mb-5 space-y-1.5">
            <li><a href="tel:+918240000000" className={link}>+91 824 000 0000</a></li>
            <li><a href="mailto:hello@tamarindandtide.in" className={link}>hello@tamarindandtide.in</a></li>
          </ul>
          <a href="#reserve" className={`${btn} ${btnSmall}`}>Book a table</a>
        </section>
      </Container>

      <Container className="mt-12 flex flex-col gap-2 border-t border-line-light pt-6 text-sm opacity-80 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Tamarind &amp; Tide. A student project, not a real restaurant.</p>
        <a href="#home" className={link}>Back to top ↑</a>
      </Container>
    </footer>
  )
}
