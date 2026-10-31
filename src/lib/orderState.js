export const refundInProgress = order => ['requested', 'pending', 'requires_action'].includes(order?.refundStatus)

export function orderState(order) {
  if (order.refundStatus === 'succeeded') return { label: 'Refunded', tone: 'refunded', description: 'Order cancelled. Stripe confirmed your full refund to the original payment method.' }
  if (['failed', 'canceled'].includes(order.refundStatus)) return { label: 'Refund unsuccessful', tone: 'failed', description: 'Your refund could not be completed. Contact the restaurant with your order number so we can help.' }
  if (order.refundStatus === 'requires_action') return { label: 'Refund needs attention', tone: 'pending', description: 'Your cancellation is recorded. Stripe needs more information to finish your refund; contact the restaurant with your order number.' }
  if (order.refundStatus === 'pending') return { label: 'Refund processing', tone: 'pending', description: 'Order cancelled. Stripe is processing your full refund to the original payment method.' }
  if (order.refundStatus === 'requested') return { label: 'Refund requested', tone: 'pending', description: 'Your refund request is saved. Check its status to safely resume or confirm the request with Stripe.' }
  if (order.status === 'cancelled') return { label: 'Cancelled', tone: 'cancelled', description: 'This unpaid checkout is closed. We hope to welcome you back for another meal.' }
  if (order.status === 'paid') return { label: 'Paid', tone: 'paid', description: 'Payment confirmed. A meal to remember.' }
  if (order.status === 'expired') return { label: 'Expired', tone: 'expired', description: 'This checkout closed before payment completed.' }
  if (order.paymentFailedAt) return { label: 'Payment unsuccessful', tone: 'failed', description: 'Your last payment attempt failed. You can try again securely.' }
  return { label: 'Awaiting payment', tone: 'pending', description: 'Your thali is saved. Complete payment when you’re ready.' }
}
