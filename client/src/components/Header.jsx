import { useState } from 'react'
import { btn, btnSmall } from '../classes'
import { authClient } from '../lib/authClient'
import ServiceToggle from './ServiceToggle'
import { Container } from './ui'

const links = [
  { href: '#about', label: 'Our story' },
  { href: '#menu', label: 'Menu' },
  { href: '#thali', label: 'Your thali' },
]

export default function Header({ service, onServiceChange, user, sessionLoading, onSignIn }) {
  // Mobile menu open / closed. Only the header cares, so it lives here.
  const [menuOpen, setMenuOpen] = useState(false)
  const close = () => setMenuOpen(false)

  function signIn() {
    close()
    onSignIn()
  }

  async function signOut() {
    close()
    // Deletes the session on the server and clears the cookie.
    // useSession() in App then gives null and everything re-renders signed out.
    await authClient.signOut()
  }

  const authLink =
    'block cursor-pointer py-2.5 font-medium decoration-chili decoration-2 underline-offset-8 hover:underline md:py-1'

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-page/90 backdrop-blur">
      <Container className="flex min-h-[72px] flex-wrap items-center gap-x-3">
        <a href="#home" className="inline-flex items-center gap-2.5 font-display text-lg font-extrabold no-underline sm:text-xl">
          <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-ink text-xs tracking-wide text-turmeric">
            T&amp;T
          </span>
          <span className="hidden min-[400px]:inline md:hidden lg:inline">Tamarind &amp; Tide</span>
        </a>

        {/* Mobile: full-width row under the bar (order-last), hidden until open.
            md and up: always visible, inline, pushed right. */}
        <nav
          id="primary-nav"
          aria-label="Primary"
          className={`${menuOpen ? 'block' : 'hidden'} order-last basis-full md:order-none md:ml-auto md:block md:basis-auto`}
        >
          <ul className="flex flex-col gap-1 pb-5 md:flex-row md:items-center md:gap-6 md:pb-0">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={close}
                  className="block py-2.5 font-medium no-underline decoration-chili decoration-2 underline-offset-8 hover:underline md:py-1"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a href="#reserve" onClick={close} className={`${btn} ${btnSmall} mt-2 md:mt-0`}>
                Book a table
              </a>
            </li>

            {/* Signed-in state. Nothing is shown until the session check
                finishes, so "Sign in" never flashes up for a signed-in user. */}
            {!sessionLoading && (
              <li className="mt-3 border-t border-line pt-2 md:mt-0 md:border-0 md:pt-0">
                {user ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-fg-soft md:hidden lg:inline">Hi, {user.name.split(' ')[0]}</span>
                    <button type="button" onClick={signOut} className={authLink}>
                      Sign out
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={signIn} className={authLink}>
                    Sign in
                  </button>
                )}
              </li>
            )}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-3">
          <ServiceToggle value={service} onChange={onServiceChange} />

          {/* Hamburger: phones only */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="primary-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="flex size-11 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg md:hidden"
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
