'use client'

import MotionSurface from './MotionSurface'

import Link from 'next/link'

import Image from 'next/image'
import { useSiteMotion } from '../lib/motionContext'
import { useSearchParams } from 'next/navigation'
import { authClient } from '../lib/authClient'
import { usePaymentService } from '../hooks/usePaymentService'
import AccountHeader from './AccountHeader'
import AuthForm from './AuthForm'
import { localReturnPath } from '../lib/localReturnPath'

export default function SignInPage() {
  const service = usePaymentService()
  const params = useSearchParams()
  const { data: session } = authClient.useSession()
  const { paused, reduced, toggle } = useSiteMotion()
  const returnTo = localReturnPath(params.get('returnTo'))
  return <MotionSurface className="restaurant-site account-site" data-service={service}>
    <AccountHeader user={session?.user} />
    <main className="signin-layout">
      <section className="signin-scene" aria-label="A moment on the coast"><Image src="/images/konark-restaurant.png" alt="" fill sizes="(max-width: 767px) 100vw, 52vw" priority className="signin-film" /><div className="signin-scene-shade" /><div className="signin-scene-copy"><span className="overline">Leave the everyday at the shore</span><p>Come for the food.<br />Stay for the <em>feeling.</em></p><span>Konark, Odisha · Bay of Bengal</span></div><button type="button" className="signin-pause" aria-pressed={paused} disabled={reduced} onClick={toggle}>{reduced ? 'Motion reduced' : paused ? 'Resume motion' : 'Pause motion'}</button></section>
      <section className="signin-form-panel">{session?.user ? <div className="auth-form-content"><p className="eyebrow">Welcome back</p><h1 className="auth-form-title">Hello,<br /><em>{session.user.name.split(' ')[0]}.</em></h1><p className="auth-form-description">Your table is just where you left it.</p><Link href={returnTo} className="button-primary">Continue <span aria-hidden="true">↗</span></Link></div> : <AuthForm headingLevel="h1" onSuccess={() => window.location.assign(returnTo)} />}</section>
    </main><footer className="account-footer"><p>Designed &amp; built by Roman Parwez</p><span>Konark, Odisha · India</span></footer>
  </MotionSurface>
}
