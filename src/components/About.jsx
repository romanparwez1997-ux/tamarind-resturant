import Image from 'next/image'
import { Container, Eyebrow } from './ui'

export default function About() {
  return <section id="about" aria-labelledby="about-title" className="coastal-story">
    <Container>
      <div className="coastal-story-heading" data-reveal><Eyebrow>02 / The house by the water</Eyebrow><h2 id="about-title">Some places ask you<br />to <em>slow down.</em></h2><p>This is one of them.</p></div>
      <div className="coastal-story-grid">
        <figure className="coastal-story-photo" data-scroll-image><Image src="/images/dining-room.png" alt="Warm teak tables and brass lights overlooking the coast" width={1536} height={1024} sizes="(max-width: 767px) 90vw, 65vw" /><figcaption>A warm table. An open horizon.</figcaption></figure>
        <div className="coastal-story-note" data-reveal><span className="overline">The Tamarind &amp; Tide way</span><h3>A little heat.<br />A little <em>horizon.</em></h3><p>Inspired by the coast of Konark, our kitchen brings together fragrant curries, roasted coconut and the simple pleasure of sharing a meal.</p><p>Build a thali that feels like you, or make an evening of it with a table by the water.</p><a href="#menu" className="text-link">Find your favourites <span aria-hidden="true">↗</span></a></div>
      </div>
      <div className="coastal-story-foot" data-reveal><span>Konark · Odisha · India</span><p>Good food. <em>Unhurried company.</em></p><span>Lunch &amp; dinner</span></div>
    </Container>
  </section>
}
