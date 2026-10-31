'use client'

import Link from 'next/link'

import { useEffect, useState } from 'react'
import { getOrder } from '../lib/api'
import { authClient } from '../lib/authClient'
import AuthDialog from './AuthDialog'
import { btn, btnGhost } from '../classes'
import { usePaymentService } from '../hooks/usePaymentService'
import { PaymentLayout, PaymentScene, PaymentReceipt } from './PaymentLayout'
import OrderCancellation from './OrderCancellation'
import { orderState, refundInProgress } from '../lib/orderState'

// The URL is only an order locator. Only the saved webhook-confirmed status is trusted.
export default function OrderStatus({ orderId, cancelled = false }) {
  const service = usePaymentService()
  const { data: session, isPending } = authClient.useSession()
  const userId = session?.user?.id
  const [authOpen, setAuthOpen] = useState(false)
  const [result, setResult] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [pollRound, setPollRound] = useState(0)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  // During SSR both user IDs can be undefined while result is still null.
  // Only expose a loaded receipt that belongs to this user and this URL.
  const order = userId && result?.userId === userId && result.order.id === orderId ? result.order : null

  useEffect(() => {
    if (!userId || !orderId) return
    const controller = new AbortController()
    let timer
    let count = 0
    async function poll() {
      try {
        const latest = await getOrder(orderId, controller.signal)
        if (controller.signal.aborted) return
        count += 1
        setResult({ userId, order: latest })
        setAttempt(count)
        setError('')
        if ((latest.status === 'pending' || refundInProgress(latest)) && count < 10) {
          setDone(false)
          timer = setTimeout(poll, 2000)
        } else {
          setDone(true)
        }
      } catch (error) {
        if (controller.signal.aborted) return
        setError(error.message)
        setDone(true)
      }
    }
    poll()
    return () => { controller.abort(); clearTimeout(timer) }
  }, [orderId, userId, pollRound])

  function retry() {
    setError('')
    setDone(false)
    setAttempt(0)
    setPollRound((round) => round + 1)
  }

  const paid = order?.status === 'paid' && !order.refundStatus
  const expired = order?.status === 'expired'
  const closed = order?.status === 'cancelled'
  const refund = !!order?.refundStatus
  const state = order && orderState(order)
  let title = cancelled ? 'Checkout paused' : 'Checking your payment'
  if (refund || closed) title = state.label
  else if (paid) title = 'Payment confirmed'
  else if (expired) title = 'Checkout expired'
  else if (done) title = 'Payment is not confirmed yet'

  const description = refund || closed ? state.description : paid ? 'Thank you. Your thali is paid for, and a little taste of the coast is yours.' : expired ? 'This payment session has ended. Your next coastal meal is only a few choices away.' : cancelled ? 'No rush. Your dishes are saved, and you can pick up where you left off.' : 'We’re checking your payment. This page will update as soon as confirmation arrives.'
  const reviewUrl = `/checkout?${new URLSearchParams({ order_id: orderId || '', service })}`

  return <PaymentLayout service={service} step={order?.paidAt ? 3 : 2}><div className="payment-layout"><PaymentScene items={order?.items} eyebrow={paid ? 'A little coast. Entirely yours.' : 'Your thali, your moment'} title={refund || closed ? <>Until<br /><em>next time.</em></> : paid ? <>Payment<br /><em>confirmed.</em></> : expired ? <>Until<br /><em>next time.</em></> : cancelled ? <>Take your<br /><em>time.</em></> : <>One little<br /><em>moment.</em></>} description={description} confirmed={paid} />
    <section className="payment-panel" aria-label="Payment status and receipt"><div className="payment-panel-top"><p>{order?.paidAt ? 'Your receipt' : 'Your payment'}</p><span className={`payment-status-pill ${paid ? 'is-paid' : ''}`} aria-live="polite">{state ? `Status: ${state.label}` : 'Awaiting confirmation'}</span></div>
      {!orderId ? <div className="payment-message"><h2>Let’s find your thali.</h2><p role="alert">This link is missing an order ID. Return to the menu to start checkout.</p></div> : isPending ? <p className="payment-loading" role="status">Checking your sign-in…</p> : !userId ? <div className="payment-message"><h2>Your receipt is waiting.</h2><p>Sign in with the account that placed this order to see its payment status.</p><button className={btn} type="button" onClick={() => setAuthOpen(true)}>Sign in to view order ↗</button></div> : <>
        <div className={`payment-confirmation ${paid ? 'is-paid' : ''}`}><span className="payment-status-symbol" aria-hidden="true">{paid ? '✓' : refund || closed || expired ? '↗' : cancelled ? 'Ⅱ' : '◷'}</span><div><h2 aria-live="polite">{error ? 'Order unavailable' : title}</h2><p>{refund || closed ? state.description : paid ? 'Your payment has been received.' : expired ? 'Choose your dishes again to start a new checkout.' : cancelled ? 'Your order is not paid yet. Return to payment whenever you’re ready.' : done ? 'If you already paid, wait a moment and check again before starting another order.' : `Waiting for payment confirmation${attempt ? ` · ${attempt}/10` : '…'}`}</p></div></div>
        {error && <p role="alert" className="payment-notice">{error}</p>}
        {order && <PaymentReceipt order={order} />}
        {order?.paidAt && <p className="payment-paid-date">Original payment on {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(order.paidAt))} IST</p>}
        {refund && <div className="refund-receipt"><p>Full refund <strong>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalAmount / 100)}</strong></p>{order.refundId && <small>Stripe refund reference: {order.refundId}</small>}<p>Test mode · no real money is moved.</p></div>}
        {paid && <><Link href="/reservations" className={`${btn} payment-pay-button`}>Make an evening of it <span aria-hidden="true">↗</span></Link><p className="payment-reservation-note">Your thali is paid. Reserve a table separately if you’d like to dine with us.</p></>}
        {!paid && !expired && !closed && !refund && done && <button type="button" onClick={retry} className={`${btnGhost} payment-pay-button`}>Check payment again ↻</button>}
        {cancelled && order?.status === 'pending' && order.checkoutUrl && <a className={`${btn} payment-pay-button`} href={reviewUrl}>Return to payment ↗</a>}
        {order && <OrderCancellation key={order.id} order={order} onUpdated={updated => { setResult({ userId, order: updated }); setPollRound(round => round + 1) }} />}
      </>}
      <Link href="/#menu-choices" className="payment-edit">← Back to menu</Link>
      <p className="payment-bottom-note">Secure payment, handled by Stripe.</p>
    </section></div>{authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}</PaymentLayout>
}
