import Link from 'next/link'
import { useState } from 'react'
import { btn, btnSmall } from '../classes'
import { authClient } from '../lib/authClient'
import ServiceToggle from './ServiceToggle'
import { Container } from './ui'

const links = [
  { href: '#about', label: 'Our story' },
  { href: '#menu', label: 'Menu' },
  { href: '#chefs-special', label: 'Chef’s kiss' },
  { href: '#thali', label: 'Your thali' },
]

export default function Header({ service, onServiceChange, user, sessionLoading }) {
  // Mobile menu open / closed. Only the header cares, so it lives here.
  const [menuOpen, setMenuOpen] = useState(false)
  const close = () => setMenuOpen(false)

  async function signOut() {
    close()
    // Deletes the session on the server and clears the cookie.
    // useSession() in App then gives null and everything re-renders signed out.
    await authClient.signOut()
  }

  const authLink =
    'block cursor-pointer py-2.5 font-medium decoration-chili decoration-2 underline-offset-8 hover:underline lg:py-1'

  return (
    <header className="site-header sticky top-0 z-50">
      <Container className="flex min-h-[88px] flex-wrap items-center gap-x-3">
        <a href="#home" className="wordmark inline-flex items-center gap-3 no-underline">
          <span aria-hidden="true" className="brand-symbol">
            ✳
          </span>
          <span className="brand-name">Tamarind <i>&amp;</i> Tide<small>Coastal kitchen · Konark, Odisha</small></span>
        </a>

        {/* Mobile: full-width row under the bar (order-last), hidden until open.
            md and up: always visible, inline, pushed right. */}
        <nav
          id="primary-nav"
          aria-label="Primary"
          className={`${menuOpen ? 'block' : 'hidden'} order-last basis-full lg:order-none lg:ml-auto lg:block lg:basis-auto`}
        >
          <ul className="flex flex-col gap-1 pb-5 lg:flex-row lg:items-center lg:gap-6 lg:pb-0">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={close}
                  className="block py-2.5 font-medium no-underline decoration-chili decoration-2 underline-offset-8 hover:underline lg:py-1"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link href="/reservations" onClick={close} className={`${btn} ${btnSmall} mt-2 lg:mt-0`}>
                Reserve a table <span aria-hidden="true">↗</span>
              </Link>
            </li>

            {/* Signed-in state. Nothing is shown until the session check
                finishes, so "Sign in" never flashes up for a signed-in user. */}
            {!sessionLoading && (
              <li className="mt-3 border-t border-line pt-2 lg:mt-0 lg:border-0 lg:pt-0">
                {user ? (
                  <div className="flex items-center gap-3">
                    <Link href="/account" className="header-profile"><span aria-hidden="true">{user.name?.slice(0, 1) || 'T'}</span>My account</Link>
                    <button type="button" onClick={signOut} className={authLink}>
                      Sign out
                    </button>
                  </div>
                ) : (
                  <Link href="/sign-in" onClick={close} className={authLink}>
                    Sign in
                  </Link>
                )}
              </li>
            )}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-3">
          <ServiceToggle value={service} onChange={onServiceChange} />

          {/* Hamburger: phones only */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="primary-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="flex size-11 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg lg:hidden"
          >
            <span className={`block h-0.5 w-[22px] rounded bg-fg transition ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-[22px] rounded bg-fg transition ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-[22px] rounded bg-fg transition ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </div>
      </Container>
    </header>
  )
}
