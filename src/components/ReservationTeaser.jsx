import Image from 'next/image'
import Link from 'next/link'
import { tableExperiences } from '../data/tableExperiences'
import { Container } from './ui'

export default function ReservationTeaser() {
  return <section id="reserve" className="reservation-teaser" aria-labelledby="reservation-teaser-title"><Container>
    <div className="reservation-teaser-heading" data-reveal><div><p className="eyebrow">The view is part of the evening</p><h2 id="reservation-teaser-title">Your table.<br /><em>Your kind of magic.</em></h2></div><p>A quiet corner, an open horizon, or a front-row seat to the kitchen. Find the setting that feels like you.</p></div>
    <div className="reservation-teaser-grid">{tableExperiences.map((experience,index) => <Link key={experience.id} href={`/reservations?experience=${experience.id}`} className="reservation-teaser-card" data-reveal style={{ '--reveal-delay': `${index * 90}ms` }}><div className="reservation-teaser-media" data-scroll-image><Image src={experience.image} alt={experience.view} width={900} height={600} sizes="(max-width: 767px) 90vw, 31vw" /><span>0{index+1}</span></div><div><h3>{experience.label}</h3><i aria-hidden="true">↗</i><p>{experience.bestFor}</p></div></Link>)}</div>
    <div className="reservation-teaser-bottom"><p>Let’s make an evening of it.</p><Link href="/reservations" className="button-primary">Choose your table <span aria-hidden="true">↗</span></Link></div>
  </Container></section>
}
