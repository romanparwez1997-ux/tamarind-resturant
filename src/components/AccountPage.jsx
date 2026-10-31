'use client'

import MotionSurface from './MotionSurface'

import Link from 'next/link'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { authClient } from '../lib/authClient'
import { getAccountSettings, getOrders } from '../lib/api'
import { dishImage } from '../data/dishImages'
import { usePaymentService } from '../hooks/usePaymentService'
import { rupees } from '../utils'
import AccountHeader from './AccountHeader'
import OrderCancellation from './OrderCancellation'
import { orderState, refundInProgress } from '../lib/orderState'

const tabs = [{ id: 'orders', label: 'Your orders', number: '01' }, { id: 'profile', label: 'Your details', number: '02' }, { id: 'security', label: 'Password & security', number: '03' }]
const date = value => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(value))

function Notice({ notice }) {
  return notice && <p role={notice.error ? 'alert' : 'status'} className={`account-notice ${notice.error ? 'is-error' : ''}`}>{notice.message}</p>
}

function OrderHistory() {
  const [query, setQuery] = useState({ page: 1, status: 'all', revision: 0 })
  const [resource, setResource] = useState(null)
  const key = JSON.stringify({ page: query.page, status: query.status })
  useEffect(() => {
    const controller = new AbortController()
    let timer, count = 0
    async function load() {
      try {
        const data = await getOrders(query.page, query.status, controller.signal)
        if (controller.signal.aborted) return
        setResource({ key, data })
        if (data.orders.some(refundInProgress) && ++count < 10) timer = setTimeout(load, 3000)
      } catch (error) { if (!controller.signal.aborted) setResource({ key, error: error.message }) }
    }
    load()
    return () => { controller.abort(); clearTimeout(timer) }
  }, [key, query.page, query.status, query.revision])
  const current = resource?.key === key ? resource : null
  return <section aria-labelledby="account-orders-title" className="account-panel">
    <div className="account-panel-heading"><div><p className="eyebrow">A taste of your time here</p><h2 id="account-orders-title">Your <em>orders.</em></h2></div><Link href="/#menu" className="text-link">Something delicious? <span aria-hidden="true">↗</span></Link></div>
    <div className="order-filters" aria-label="Filter orders">{[['all', 'All orders'], ['paid', 'Paid'], ['pending', 'Awaiting payment'], ['unsuccessful', 'Unsuccessful'], ['cancelled', 'Cancelled'], ['refunds', 'Refunds']].map(([value, label]) => <button key={value} type="button" aria-pressed={query.status === value} onClick={() => setQuery({ page: 1, status: value, revision: 0 })}>{label}</button>)}</div>
    {!current && <div className="account-empty" role="status"><span className="account-wave" aria-hidden="true">≈</span><p>Bringing your orders to the table…</p></div>}
    {current?.error && <div className="account-empty"><p role="alert">{current.error}</p><button type="button" className="text-link" onClick={() => setQuery(value => ({ ...value, revision: value.revision + 1 }))}>Try again ↗</button></div>}
    {current?.data && (current.data.orders.length ? <div className="account-orders">{current.data.orders.map(order => {
      const state = orderState(order)
      return <article key={order.id} className="account-order">
        <div className="account-order-top"><div><time dateTime={order.createdAt}>{date(order.createdAt)}</time><span>Order {order.id.slice(0, 8).toUpperCase()}</span></div><span className={`order-status status-${state.tone}`} aria-live="polite">{state.label}</span></div>
        <div className="account-order-body"><div className="account-order-photos" aria-hidden="true">{order.items.slice(0, 3).map(item => dishImage(item.dishId) && <Image src={dishImage(item.dishId)} key={item.dishId} alt="" width={100} height={100} sizes="75px" />)}</div><div className="account-order-dishes">{order.items.map(item => <p key={item.dishId}>{item.qty} × {item.name}</p>)}</div><strong>{rupees(order.totalAmount / 100)}</strong></div>
        <div className="account-order-bottom"><p>{state.description}</p>{['expired', 'cancelled'].includes(order.status) ? <Link href="/#menu-choices" className="text-link">Build another thali ↗</Link> : <Link href={order.status === 'paid' ? `/checkout/success?order_id=${order.id}` : `/checkout?order_id=${order.id}`} className="text-link">{order.status === 'paid' ? 'View receipt' : 'Continue payment'} <span aria-hidden="true">↗</span></Link>}</div>
        <OrderCancellation order={order} onUpdated={updated => {
          setResource(value => value?.key === key && value.data ? { ...value, data: { ...value.data, orders: value.data.orders.map(saved => saved.id === updated.id ? { ...saved, ...updated } : saved) } } : value)
          setQuery(value => ({ ...value, revision: value.revision + 1 }))
        }} />
      </article>
    })}</div> : <div className="account-empty"><span className="account-wave" aria-hidden="true">≈</span><h3>{query.status === 'all' ? 'Your story starts with a plate.' : 'Nothing here just yet.'}</h3><p>{query.status === 'all' ? 'Your orders and payment updates will appear here.' : 'Try another filter to see your other orders.'}</p><Link href="/#menu" className="button-primary">Explore the menu ↗</Link></div>)}
    {current?.data && (query.page > 1 || current.data.hasMore) && <nav className="orders-pagination" aria-label="Order history pages"><button type="button" className="button-secondary button-small" disabled={query.page === 1} onClick={() => setQuery(value => ({ ...value, page: value.page - 1 }))}>Previous</button><span>Page {query.page}</span><button type="button" className="button-secondary button-small" disabled={!current.data.hasMore} onClick={() => setQuery(value => ({ ...value, page: value.page + 1 }))}>Next</button></nav>}
  </section>
}

function ProfileSettings({ user, refetch }) {
  const [settings, setSettings] = useState(null)
  const [settingsError, setSettingsError] = useState(false)
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState(null)
  const lock = useRef(false)
  useEffect(() => {
    let active = true
    getAccountSettings().then(value => { if (active) setSettings(value) }).catch(() => { if (active) setSettingsError(true) })
    return () => { active = false }
  }, [])
  async function update(kind, action, message) {
    if (lock.current) return
    lock.current = true
    setBusy(kind)
    setNotice(null)
    try {
      const result = await action()
      if (result.error) throw new Error(result.error.message || 'Could not save your changes.')
      await refetch()
      setNotice({ message })
    } catch (error) { setNotice({ message: error.message || 'Please try again.', error: true }) }
    finally { lock.current = false; setBusy('') }
  }
  return <section className="account-panel" aria-labelledby="account-profile-title"><div className="account-panel-heading"><div><p className="eyebrow">The little details</p><h2 id="account-profile-title">Make it <em>yours.</em></h2></div></div>
    <Notice notice={notice} />
    <form method="post" className="account-form account-settings-form" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); if (!data.get('name').trim()) return setNotice({ error: true, message: 'Please enter your name.' }); update('name', () => authClient.updateUser({ name: data.get('name').trim() }), 'Your name has been updated.') }}><h3>Your name</h3><label htmlFor="profile-name">Name<input id="profile-name" name="name" defaultValue={user.name} key={user.name} autoComplete="name" required maxLength={100} disabled={!!busy} /></label><button className="button-primary" disabled={!!busy}>{busy === 'name' ? 'Saving…' : 'Save name'} <span aria-hidden="true">↗</span></button></form>
    <div className="account-settings-form"><h3>Email address</h3><div className="account-current-email"><p>{user.email}</p><span className={`order-status ${user.emailVerified ? 'status-paid' : 'status-pending'}`}>{user.emailVerified ? 'Verified' : 'Not verified'}</span></div>
      {!user.emailVerified && <button type="button" className="text-link" disabled={!settings?.emailDeliveryReady || !!busy} onClick={() => update('verify', () => authClient.sendVerificationEmail({ email: user.email, callbackURL: '/account?email=verified' }), 'Verification email sent. Open the link in your inbox to confirm your address.')}>{busy === 'verify' ? 'Sending…' : 'Send verification email'} <span aria-hidden="true">↗</span></button>}
      {!settings && !settingsError && <p className="account-help" role="status">Checking email availability…</p>}
      {(settingsError || settings?.emailDeliveryReady === false) && <p className="account-help">Email verification and email changes are temporarily unavailable. Please try again later.</p>}
      <form method="post" className="account-form" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); update('email', () => authClient.changeEmail({ newEmail: data.get('email').trim(), callbackURL: '/account?email=verified' }), user.emailVerified ? 'Check your current inbox to approve this change. Then confirm the new email address.' : 'Check your new inbox to confirm the address. Your email stays the same until you verify it.') }}><label htmlFor="profile-email">New email address<input id="profile-email" name="email" type="email" placeholder="Your new email address" autoComplete="email" required disabled={!settings?.emailDeliveryReady || !!busy} /></label><p className="account-help">Your email changes only after confirmation. If your current address is verified, you’ll approve the request there first.</p><button className="button-secondary" disabled={!settings?.emailDeliveryReady || !!busy}>{busy === 'email' ? 'Sending confirmation…' : 'Request email change'}</button></form>
    </div>
  </section>
}

function SecuritySettings() {
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const lock = useRef(false)
  async function submit(event) {
    event.preventDefault()
    if (lock.current) return
    const form = event.currentTarget
    const values = new FormData(form)
    if (values.get('newPassword') !== values.get('confirmPassword')) return setNotice({ error: true, message: 'Your new passwords don’t match.' })
    if (values.get('newPassword') === values.get('currentPassword')) return setNotice({ error: true, message: 'Choose a different new password.' })
    lock.current = true
    setBusy(true)
    setNotice(null)
    try {
      const result = await authClient.changePassword({ currentPassword: values.get('currentPassword'), newPassword: values.get('newPassword'), revokeOtherSessions: true })
      if (result.error) throw new Error(result.error.message || 'Could not update your password.')
      form.reset()
      setNotice({ message: 'Password updated. Other devices have been signed out.' })
    } catch (error) { setNotice({ error: true, message: error.message || 'Please try again.' }) }
    finally { lock.current = false; setBusy(false) }
  }
  return <section className="account-panel" aria-labelledby="account-security-title"><div className="account-panel-heading"><div><p className="eyebrow">A little peace of mind</p><h2 id="account-security-title">Your account.<br /><em>Kept safe.</em></h2></div></div><Notice notice={notice} /><form method="post" className="account-form account-settings-form" onSubmit={submit}><h3>Change your password</h3><label htmlFor="current-password">Current password<input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required disabled={busy} /></label><label htmlFor="new-password">New password<input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required disabled={busy} /><small>At least 8 characters. Choose something you haven’t used here before.</small></label><label htmlFor="confirm-password">Confirm new password<input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required disabled={busy} /></label><p className="account-help">You’ll stay signed in here. Your other sessions will be signed out.</p><button className="button-primary" disabled={busy}>{busy ? 'Updating…' : 'Update password'} <span aria-hidden="true">↗</span></button></form></section>
}

export default function AccountPage() {
  const { data: session, isPending, refetch } = authClient.useSession()
  const [tab, setTab] = useState('orders')
  const [signOutBusy, setSignOutBusy] = useState(false)
  const [signOutError, setSignOutError] = useState('')
  const params = useSearchParams()
  const service = usePaymentService()
  const user = session?.user
  async function signOut() {
    setSignOutBusy(true)
    setSignOutError('')
    try {
      const result = await authClient.signOut()
      if (result.error) throw new Error(result.error.message)
      window.location.assign('/sign-in')
    } catch { setSignOutBusy(false); setSignOutError('Could not sign out. Please try again.') }
  }
  return <MotionSurface className="restaurant-site account-site" data-service={service}><AccountHeader user={user} />
    {isPending ? <main className="account-loading" role="status">Finding your place at the table…</main> : !user ? <main className="account-signed-out"><p className="eyebrow">Your place at the table</p><h1>A familiar<br /><em>feeling.</em></h1><p>Sign in to see your orders and manage your details.</p><Link href="/sign-in?returnTo=%2Faccount" className="button-primary">Sign in ↗</Link></main> : <main className="account-main">
      <div className="account-welcome"><div><p className="overline">Your coastal corner</p><h1>Hello, <em>{user.name.split(' ')[0]}.</em></h1><p>Good food. Familiar faces. A place of your own.</p></div><div className="account-member-mark" aria-hidden="true"><span>{user.name.slice(0, 1)}</span><i>At home by the coast</i></div></div>
      {params.get('email') === 'verified' && <p role="status" className="account-notice">{user.emailVerified ? 'Your email address is confirmed.' : 'Your email approval was received. Check your inbox to finish any remaining confirmation.'}</p>}
      {params.get('error') && <p role="alert" className="account-notice is-error">That email link could not be confirmed. Request a fresh link from Your details.</p>}
      <div className="account-workspace"><aside className="account-sidebar"><nav aria-label="Account sections">{tabs.map(item => <button key={item.id} type="button" aria-pressed={tab === item.id} onClick={() => setTab(item.id)}><span>{item.number}</span>{item.label}<i aria-hidden="true">↗</i></button>)}</nav><button type="button" className="account-signout" disabled={signOutBusy} onClick={signOut}>{signOutBusy ? 'Signing out…' : 'Sign out'} <span aria-hidden="true">↗</span></button>{signOutError && <p role="alert" className="account-help">{signOutError}</p>}<div className="account-sidebar-note"><span aria-hidden="true">≈</span><p>A little coast.<br />A lot of <em>soul.</em></p><small>Konark, Odisha</small></div></aside>
        {tab === 'orders' ? <OrderHistory /> : tab === 'profile' ? <ProfileSettings user={user} refetch={refetch} /> : <SecuritySettings />}
      </div>
    </main>}<footer className="account-footer"><p>Designed &amp; built by Roman Parwez</p><Link href="/#visit">Find us in Konark ↗</Link></footer>
  </MotionSurface>
}
