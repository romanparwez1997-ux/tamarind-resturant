import Link from 'next/link'
import { services } from '../data/site'
import { Container } from './ui'

export default function Hero({ service }) {
  return <section id="home" className="coastal-hero" data-hero-scene aria-labelledby="hero-title">
    <div className="coastal-hero-sticky">
      <Container className="coastal-hero-layout">
        <div className="coastal-hero-copy">
          <p className="overline coastal-arrive">Konark, Odisha · On coastal time</p>
          <h1 id="hero-title"><span className="coastal-line"><span>Follow the sea.</span></span><span className="coastal-line"><span>Find your <em>table.</em></span></span></h1>
          <p className="coastal-hero-description coastal-arrive">Salt in the air. Something wonderful on the fire.<br />Stay a little longer at Tamarind &amp; Tide.</p>
          <div className="coastal-hero-actions coastal-arrive"><a className="button-primary" href="#menu">Explore the menu <span aria-hidden="true">↗</span></a><Link className="coastal-reserve-link" href="/reservations">Reserve a table <span aria-hidden="true">↗</span></Link></div>
        </div>
        <div className="coastal-invitation"><p className="overline">A little closer to the coast</p><p>The evening<br />is <em>yours.</em></p><a href="#about" className="text-link">Step inside <span aria-hidden="true">↗</span></a></div>
        <div className="coastal-hero-bottom"><a href="#about" className="scroll-invitation"><span className="scroll-line" />Scroll into the evening</a><span>{services[service].label} · {services[service].hours}</span><span>Bay of Bengal, India</span></div>
      </Container>
      <span className="coastal-scene-number" aria-hidden="true">01 / 03 <i /> THE SHORE</span>
    </div>
  </section>
}
