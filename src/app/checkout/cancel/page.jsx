import OrderStatus from '@/components/OrderStatus'

export const dynamic = 'force-dynamic'
// oxlint-disable-next-line react/only-export-components
export const metadata = { title: 'Checkout paused — Tamarind & Tide' }

export default async function CheckoutPage({ searchParams }) {
  const { order_id } = await searchParams
  return <OrderStatus orderId={typeof order_id === 'string' ? order_id : ''} cancelled />
}
