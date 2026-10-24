import { useEffect, useRef, useState } from 'react'
import { btn, fieldLabel, textInput } from '../classes'
import { authClient } from '../lib/authClient'

// Sign-in / create-account popup. App shows it when authOpen is true.
// It uses the browser's own <dialog>, which gives us the dark backdrop,
// focus kept inside the popup, and Esc to close for free.
export default function AuthDialog({ onClose }) {
  const dialogRef = useRef(null)

  const [mode, setMode] = useState('signIn') // 'signIn' | 'signUp'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isSignUp = mode === 'signUp'

  // Open as a modal as soon as the component appears
  useEffect(() => {
    if (!dialogRef.current.open) dialogRef.current.showModal()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)

    // Better Auth returns { data, error } instead of throwing.
    // Signing up also signs you in straight away.
    const { error } = isSignUp
      ? await authClient.signUp.email({ name, email, password })
      : await authClient.signIn.email({ email, password })

    setBusy(false)
    if (error) {
      setError(error.message || 'Something went wrong. Please try again.')
      return
    }
    // Success: the server has set the session cookie. useSession() in App
    // notices by itself and the header switches to "Sign out".
    onClose()
  }

  function switchMode() {
    setMode(isSignUp ? 'signIn' : 'signUp')
    setError('')
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // a click on the backdrop lands on the <dialog> itself, not the form
      onClick={(event) => event.target === dialogRef.current && onClose()}
      aria-labelledby="auth-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-[20px] bg-paper p-0 text-ink shadow-2xl backdrop:bg-ink/70 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={handleSubmit} className="grid gap-4 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 id="auth-title" className="font-display text-3xl font-bold">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 flex-none cursor-pointer place-items-center rounded-full text-xl hover:bg-ink/10"
          >
            ×
          </button>
        </div>
        <p className="-mt-2 text-sm text-ink-soft">
          {isSignUp ? 'So you can book a table and see your bookings.' : 'Sign in to book a table.'}
        </p>

        {isSignUp && (
          <div className="grid gap-1.5">
            <label htmlFor="auth-name" className={`${fieldLabel} text-ink-soft`}>Name</label>
            <input
              id="auth-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              className={textInput}
            />
          </div>
        )}

        <div className="grid gap-1.5">
          <label htmlFor="auth-email" className={`${fieldLabel} text-ink-soft`}>Email</label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className={textInput}
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="auth-password" className={`${fieldLabel} text-ink-soft`}>Password</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            minLength={8}
            required
            className={textInput}
          />
          {isSignUp && <span className="text-xs text-ink-soft">At least 8 characters.</span>}
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-chili/10 px-3.5 py-2.5 text-sm font-bold text-chili">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className={`${btn} w-full`}>
          {busy ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
        </button>

        <p className="text-center text-sm text-ink-soft">
          {isSignUp ? 'Already have an account?' : 'New here?'}{' '}
          <button type="button" onClick={switchMode} className="cursor-pointer font-bold text-chili underline underline-offset-4">
            {isSignUp ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </form>
    </dialog>
  )
}
