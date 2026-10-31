'use client'

import Link from 'next/link'

import { useEffect, useState } from 'react'
import { authClient } from '../lib/authClient'
import { getOrder } from '../lib/api'
import { usePaymentService } from '../hooks/usePaymentService'
import { PaymentLayout, PaymentScene, PaymentReceipt, PaymentTestCard } from './PaymentLayout'
import AuthDialog from './AuthDialog'
import { btn, btnGhost } from '../classes'

export default function CheckoutReview({ orderId, initialService }) {
  const service = usePaymentService(initialService)
  const { data: session, isPending } = authClient.useSession()
  const userId = session?.user?.id
  const [result, setResult] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [retry, setRetry] = useState(0)
  const current = userId && result?.userId === userId && result.orderId === orderId ? result : null
  const order = current?.order
  const error = current?.error
  const loading = !current

  useEffect(() => {
    if (!userId || !orderId) return
    const controller = new AbortController()
    getOrder(orderId, controller.signal).then(order => {
      if (!controller.signal.aborted) { setResult({ userId, orderId, order }) }
    }).catch(error => { if (!controller.signal.aborted) { setResult({ userId, orderId, error: error.message }) } })
    return () => controller.abort()
  }, [userId, orderId, retry])

  const backToDishes = order ? `/?${new URLSearchParams({ restore_order: order.id, service })}#menu-choices` : '/#menu-choices'
  return <PaymentLayout service={service} backHref={backToDishes}><div className="payment-layout"><PaymentScene items={order?.items} title={<>Your thali.<br /><em>Almost yours.</em></>} description="A few lovely things from the coast. Review your selection, then make it yours with a secure payment." />
    <section className="payment-panel" aria-label="Review and pay"><div className="payment-panel-top"><p>Review &amp; pay</p><span className="payment-secure"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="4" y="8" width="12" height="10" rx="2" stroke="currentColor" /><path d="M6 8V5a4 4 0 0 1 8 0v3" stroke="currentColor" /></svg>Secure checkout</span></div>
      {!orderId ? <div className="payment-message"><h2>Your leaf is waiting.</h2><p>Choose a few dishes from the menu to start your order.</p><Link className={btn} href="/#menu-choices">Explore the menu ↗</Link></div> : isPending ? <p className="payment-loading" role="status">Checking your sign-in…</p> : !userId ? <div className="payment-message"><h2>A thali of your own.</h2><p>Sign in with the account that placed this order to review and pay.</p><button type="button" className={btn} onClick={() => setAuthOpen(true)}>Sign in to continue ↗</button></div> : loading ? <p className="payment-loading" role="status">Preparing your order summary…</p> : error ? <div className="payment-message"><h2>Let’s take another look.</h2><p role="alert">{error}</p><button type="button" className={btnGhost} onClick={() => { setResult(null); setRetry(value => value + 1) }}>Try again</button></div> : order && <>
        <PaymentReceipt order={order} />
        {order.status === 'pending' ? <><div className="payment-method"><span className="payment-card-icon" aria-hidden="true">▱</span><div><strong>Card payment</strong><p>Visa, Mastercard &amp; other supported cards</p></div><span className="payment-method-check" aria-hidden="true">✓</span></div>{order.checkoutUrl ? <a href={order.checkoutUrl} className={`${btn} payment-pay-button`}>Continue to secure payment <span aria-hidden="true">↗</span></a> : <p role="alert" className="payment-notice">This order has no payment session. Return to the menu to start checkout again.</p>}<p className="payment-redirect-note">You’ll enter your card details on Stripe’s secure payment page.</p><a className="payment-edit" href={backToDishes}>← Change your dishes</a></> : <div className="payment-message"><p>{order.refundStatus ? 'A cancellation and refund has been requested for this order. Open the receipt for its latest status.' : order.status === 'paid' ? 'This order has already been paid. Your receipt is ready.' : order.status === 'cancelled' ? 'This order was cancelled. Choose your dishes to start a new order.' : 'This checkout has expired. Choose your dishes to start a new order.'}</p><Link className={btn} href={order.status === 'paid' ? `/checkout/success?order_id=${order.id}` : '/#menu-choices'}>{order.status === 'paid' ? 'View payment receipt ↗' : 'Back to menu ↗'}</Link></div>}
        <p className="payment-reservation-note">Making an evening of it? Table reservations are booked separately.</p>
      </>}
      <PaymentTestCard />
    </section></div>{authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}</PaymentLayout>
}
