import { Suspense } from 'react'
import AccountPage from '../../components/AccountPage'

// Next.js page metadata belongs alongside its page component.
// oxlint-disable-next-line react/only-export-components
export const metadata = { title: 'Your account — Tamarind & Tide', robots: { index: false, follow: false } }

export default function Page() {
  return <Suspense fallback={<main className="account-loading">Finding your place at the table…</main>}><AccountPage /></Suspense>
}
