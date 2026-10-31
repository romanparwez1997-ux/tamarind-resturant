'use client'

import { useRef, useState } from 'react'
import { cancelOrder, getOrder } from '../lib/api'
import { refundInProgress } from '../lib/orderState'
import { rupees } from '../utils'

export default function OrderCancellation({ order, onUpdated }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  const pendingRefund = refundInProgress(order)
  const canCancel = !order.refundStatus && ['pending', 'paid'].includes(order.status)
  if (!canCancel && !pendingRefund) return null

  async function submit() {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    try {
      const updated = await cancelOrder(order.id)
      setConfirming(false)
      onUpdated(updated)
    } catch (failure) {
      setError(failure.message || 'Could not update this order. Please try again.')
      // A network timeout is not proof that Stripe rejected the refund.
      try { onUpdated(await getOrder(order.id)) } catch { /* Keep the original error visible. */ }
    } finally { lock.current = false; setBusy(false) }
  }

  return <div className="order-cancellation" aria-label={`Cancellation for order ${order.id.slice(0, 8)}`}>
    {error && <p role="alert" className="order-cancellation-error">{error}</p>}
    {pendingRefund ? <button type="button" className="text-link" disabled={busy} onClick={submit}>{busy ? 'Checking with Stripe…' : 'Check refund ↻'}</button> : confirming ? <div className="order-cancellation-confirm" role="group" aria-label="Confirm order cancellation">
      <h3>{order.status === 'paid' ? 'Shall we cancel and refund?' : 'Cancel this order?'}</h3>
      <p>{order.status === 'paid' ? `We’ll request a full refund of ${rupees(order.totalAmount / 100)} to your original payment method.` : 'We’ll close this Stripe checkout so it can no longer accept payment.'} Your table reservation is separate.</p>
      <div><button type="button" className="button-secondary button-small" disabled={busy} onClick={() => setConfirming(false)}>Keep my order</button><button type="button" className="button-primary button-small" disabled={busy} onClick={submit}>{busy ? 'Sending request…' : order.status === 'paid' ? 'Confirm cancellation & refund' : 'Confirm cancellation'}</button></div>
    </div> : <button type="button" className="text-link order-cancel-trigger" onClick={() => { setError(''); setConfirming(true) }}>{order.status === 'paid' ? 'Cancel order & refund' : 'Cancel order'}</button>}
  </div>
}
