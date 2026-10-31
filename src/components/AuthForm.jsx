'use client'

import { useId, useRef, useState } from 'react'
import { authClient } from '../lib/authClient'

export default function AuthForm({ onSuccess, headingLevel = 'h2' }) {
  const id = useId()
  const lock = useRef(false)
  const [mode, setMode] = useState('signIn')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const signUp = mode === 'signUp'
  const Heading = headingLevel

  async function submit(event) {
    event.preventDefault()
    if (lock.current) return
    const data = new FormData(event.currentTarget)
    if (signUp && !data.get('name').trim()) return setError('Please enter your name.')
    lock.current = true
    setBusy(true)
    setError('')
    try {
      const result = signUp
        ? await authClient.signUp.email({ name: data.get('name').trim(), email: data.get('email').trim(), password: data.get('password') })
        : await authClient.signIn.email({ email: data.get('email').trim(), password: data.get('password') })
      if (result.error) throw new Error(result.error.message || 'Unable to sign in. Please try again.')
      onSuccess()
    } catch (error) { setError(error.message || 'Please check your connection and try again.') }
    finally { lock.current = false; setBusy(false) }
  }

  return <div className="auth-form-content">
    <p className="eyebrow">Your place at the table</p>
    <Heading className="auth-form-title">{signUp ? <>Make yourself<br /><em>at home.</em></> : <>Good to have<br />you <em>back.</em></>}</Heading>
    <p className="auth-form-description">{signUp ? 'A little closer to your next favourite meal.' : 'Your favourites, your table, your coastal escape.'}</p>
    <form method="post" onSubmit={submit} className="account-form" key={mode}>
      {signUp && <label htmlFor={id + '-name'}>Your name<input id={id + '-name'} name="name" autoComplete="name" required maxLength={100} disabled={busy} /></label>}
      <label htmlFor={id + '-email'}>Email address<input id={id + '-email'} name="email" type="email" autoComplete="email" required disabled={busy} /></label>
      <label htmlFor={id + '-password'}>Password<input id={id + '-password'} name="password" type="password" autoComplete={signUp ? 'new-password' : 'current-password'} minLength={8} maxLength={128} required disabled={busy} />{signUp && <small>At least 8 characters.</small>}</label>
      {error && <p role="alert" className="account-notice is-error">{error}</p>}
      <button type="submit" className="button-primary" disabled={busy}>{busy ? 'One moment…' : signUp ? 'Create your account' : 'Sign in'} <span aria-hidden="true">↗</span></button>
    </form>
    <p className="auth-switch">{signUp ? 'Already found us?' : 'First time here?'} <button type="button" disabled={busy} onClick={() => { setMode(signUp ? 'signIn' : 'signUp'); setError('') }}>{signUp ? 'Sign in' : 'Create an account'}</button></p>
  </div>
}
