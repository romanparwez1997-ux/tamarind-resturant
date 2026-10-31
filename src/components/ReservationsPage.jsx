'use client'

import MotionSurface from './MotionSurface'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { authClient } from '../lib/authClient'
import { usePaymentService } from '../hooks/usePaymentService'
import { tableExperiences } from '../data/tableExperiences'
import { useSiteMotion } from '../lib/motionContext'
import AccountHeader from './AccountHeader'
import ServiceToggle from './ServiceToggle'
import AuthDialog from './AuthDialog'
import Reserve from './Reserve'
import Footer from './Footer'

export default function ReservationsPage() {
  const [choice, setChoice] = useState(null)
  const service = usePaymentService(choice)
  const params = useSearchParams()
  const { data: session, isPending } = authClient.useSession()
  const [authOpen,setAuthOpen] = useState(false)
  const {paused,reduced,toggle} = useSiteMotion()
  const requested = params.get('experience')
  const initialExperience = tableExperiences.some(item=>item.id===requested) ? requested : 'all'
  return <MotionSurface className="restaurant-site reservations-site" data-service={service}><AccountHeader user={session?.user} /><main id="main">
    <div className="reservations-page-heading"><div><p className="eyebrow">A place for your favourite people</p><h1>Find your<br /><em>favourite view.</em></h1><p>Choose the setting. Pick your table.<br />We’ll save a little piece of the evening for you.</p></div><div className="reservation-service"><span className="overline">Your kind of evening</span><ServiceToggle value={service} onChange={setChoice} /><p>Reservations are free.<br />Food orders are paid for separately.</p></div></div>
    <Reserve key={initialExperience} service={service} user={session?.user} sessionLoading={isPending} onSignIn={()=>setAuthOpen(true)} initialExperience={initialExperience} />
  </main><Footer motionPaused={paused} motionReduced={reduced} onToggleMotion={toggle} />{authOpen&&<AuthDialog onClose={()=>setAuthOpen(false)} />}</MotionSurface>
}
