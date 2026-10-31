import CheckoutReview from '@/components/CheckoutReview'

export const dynamic = 'force-dynamic'
// oxlint-disable-next-line react/only-export-components
export const metadata = { title: 'Review & pay — Tamarind & Tide' }

export default async function CheckoutPage({ searchParams }) {
  const { order_id, service } = await searchParams
  return <CheckoutReview orderId={typeof order_id === 'string' ? order_id : ''} initialService={typeof service === 'string' ? service : undefined} />
}
