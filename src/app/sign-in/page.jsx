import { Suspense } from 'react'
import SignInPage from '../../components/SignInPage'

// Next.js page metadata belongs alongside its page component.
// oxlint-disable-next-line react/only-export-components
export const metadata = { title: 'Sign in — Tamarind & Tide' }

export default function Page() {
  return <Suspense fallback={<main className="account-loading">Preparing your coastal escape…</main>}><SignInPage /></Suspense>
}
