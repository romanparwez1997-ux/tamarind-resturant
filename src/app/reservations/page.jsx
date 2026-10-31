import { Suspense } from 'react'
import ReservationsPage from '../../components/ReservationsPage'

// oxlint-disable-next-line react/only-export-components
export const metadata = { title: 'Find your table — Tamarind & Tide', description: 'Choose an ocean view, a classic courtyard table or a seat at the chef’s counter in Konark.' }

export default function Page() {
  return <Suspense fallback={<main className="account-loading">A little place by the coast is waiting…</main>}><ReservationsPage /></Suspense>
}
